// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync, spawn } = require('child_process');
const { Client, EthereumTransaction, Hbar, PrivateKey } = require('@hashgraph/sdk');
const { ethers } = require('hardhat');

function withTimeout(promise, timeoutMs, label) {
  const ms = Math.max(0, Number(timeoutMs) || 0);
  if (ms <= 0) {
    return promise;
  }
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

function parseOptionalInt(value) {
  if (!value) {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return undefined;
  }
  const n = Number.parseInt(normalized, 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return n;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_e) {
    return { ok: response.ok, status: response.status, body: text };
  }
}

async function getJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_e) {
    return { ok: response.ok, status: response.status, body: text };
  }
}

async function captureDiagnostics(diagDir, namespace, rpcUrl, mirrorUrl, txHash) {
  if (!diagDir) {
    return;
  }
  fs.mkdirSync(diagDir, { recursive: true });
  const diagFile = path.join(diagDir, `diag-${txHash}.json`);

  const now = new Date().toISOString();
  const body = {
    timestamp: now,
    txHash,
    rpcUrl,
    mirrorUrl,
    namespace,
    rpc: {},
    mirror: {},
    k8s: {},
  };

  try {
    body.rpc.tx = await postJson(rpcUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getTransactionByHash',
      params: [txHash],
    });
  } catch (e) {
    body.rpc.tx = { error: String(e?.message || e) };
  }

  try {
    body.rpc.receipt = await postJson(rpcUrl, {
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    });
  } catch (e) {
    body.rpc.receipt = { error: String(e?.message || e) };
  }

  try {
    body.rpc.block = await postJson(rpcUrl, {
      jsonrpc: '2.0',
      id: 3,
      method: 'eth_getBlockByHash',
      params: [body.rpc.receipt?.result?.blockHash || '0x', true],
    });
  } catch (e) {
    body.rpc.block = { error: String(e?.message || e) };
  }

  try {
    body.mirror.contractResult = await getJson(`${mirrorUrl}/api/v1/contracts/results/${txHash}`);
  } catch (e) {
    body.mirror.contractResult = { error: String(e?.message || e) };
  }

  if (namespace) {
    try {
      body.k8s.relayLogs = execSync(
        `kubectl logs -n ${namespace} deploy/relay-1 --since=2m`,
        { encoding: 'utf8' }
      );
    } catch (e) {
      body.k8s.relayLogs = `ERROR: ${String(e?.message || e)}`;
    }
    try {
      body.k8s.nodeLogs = execSync(
        `kubectl logs -n ${namespace} pod/network-node1-0 -c root-container --since=2m`,
        { encoding: 'utf8' }
      );
    } catch (e) {
      body.k8s.nodeLogs = `ERROR: ${String(e?.message || e)}`;
    }
  }

  fs.writeFileSync(diagFile, JSON.stringify(body, null, 2), 'utf8');
  console.log(`ODIN_DIAG_FILE=${diagFile}`);
}

async function sendViaRelay({
  signer,
  txTo,
  txData,
  gasLimit,
}) {
  const request = { to: txTo, data: txData };
  if (gasLimit) {
    request.gasLimit = BigInt(gasLimit);
  }
  return signer.sendTransaction(request);
}

async function sendViaHapiEthereum({
  rpcUrl,
  hederaNodeUrl,
  hederaNodeAccountId,
  soloNamespace,
  operatorId,
  operatorKeyDer,
  signerPrivateKeyHex,
  txTo,
  txData,
  gasLimit,
  gasPrice,
  chainId,
  nonce,
}) {
  // Emit progress markers (useful when action is retried and/or fails).
  console.log('ODIN_HAPI_STAGE=prepare');

  const wallet = new ethers.Wallet(signerPrivateKeyHex);
  const txRequest = {
    type: 0,
    chainId,
    nonce,
    to: txTo,
    data: txData,
    value: 0,
    gasLimit: BigInt(gasLimit),
    gasPrice: BigInt(gasPrice),
  };

  const signedTx = await wallet.signTransaction(txRequest);
  const txHash = ethers.keccak256(signedTx);
  console.log(`ODIN_ACTION_TX_HASH=${txHash}`);

  let portForward;
  let effectiveNodeUrl = hederaNodeUrl;
  let client;

  const parsed = /^(?<host>[^:]+):(?<port>\d+)$/.exec(hederaNodeUrl);
  if (!parsed) {
    throw new Error(`Invalid ODIN_HEDERA_NODE_URL value (expected host:port): ${hederaNodeUrl}`);
  }
  const initialHost = parsed.groups.host;
  const initialPort = Number(parsed.groups.port);

  const isReachable = await isTcpReachable(initialHost, initialPort, 500);
  if (!isReachable) {
    if (!soloNamespace) {
      throw new Error(
        `Cannot reach ${hederaNodeUrl} and no ODIN_SOLO_NAMESPACE provided to create a kubectl port-forward`
      );
    }
    const localPort = await findFreePort();
    console.log(`ODIN_HAPI_STAGE=port-forward (localPort=${localPort})`);
    let portForwardLogs = '';
    const maxPortForwardLogBytes = 8192;
    portForward = spawn(
      'kubectl',
      ['-n', soloNamespace, 'port-forward', 'pod/network-node1-0', `${localPort}:50211`],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    );
    const capture = (label, data) => {
      const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
      portForwardLogs = `${portForwardLogs}[${label}] ${text}`;
      if (portForwardLogs.length > maxPortForwardLogBytes) {
        portForwardLogs = portForwardLogs.slice(-maxPortForwardLogBytes);
      }
    };
    if (portForward.stdout) {
      portForward.stdout.on('data', (d) => capture('stdout', d));
    }
    if (portForward.stderr) {
      portForward.stderr.on('data', (d) => capture('stderr', d));
    }
    effectiveNodeUrl = `127.0.0.1:${localPort}`;
    const ready = await waitForTcpReady('127.0.0.1', localPort, 5000);
    if (!ready) {
      try {
        portForward.kill('SIGKILL');
      } catch (_e) {
        // ignore
      }
      throw new Error(
        `Timed out starting kubectl port-forward for HAPI gRPC. ${portForwardLogs}`.trim()
      );
    }
    console.log('ODIN_HAPI_STAGE=port-forward-ready');
  }

  try {
    console.log('ODIN_HAPI_STAGE=execute');
    client = Client.forNetwork({ [effectiveNodeUrl]: hederaNodeAccountId }).setOperator(
      operatorId,
      PrivateKey.fromStringDer(operatorKeyDer)
    );
    // Keep HAPI calls bounded; the runner handles retries at the test harness level.
    client.setRequestTimeout(15000);
    client.setMaxAttempts(1);
    client.setDefaultMaxTransactionFee(new Hbar(10));

    const hapiTimeoutMs = parseOptionalInt(process.env.ODIN_HAPI_TIMEOUT_MS) || 45000;
    await withTimeout(
      new EthereumTransaction()
        .setEthereumData(ethers.getBytes(signedTx))
        .setMaxGasAllowanceHbar(new Hbar(10))
        .execute(client),
      hapiTimeoutMs,
      'HAPI EthereumTransaction.execute'
    );
    console.log('ODIN_HAPI_STAGE=execute-done');
  } finally {
    if (client) {
      try {
        client.close();
      } catch (_e) {
        // ignore
      }
    }
    if (portForward) {
      try {
        portForward.kill('SIGTERM');
      } catch (_e) {
        // ignore
      }
    }
  }

  return { hash: txHash };
}

async function isTcpReachable(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const timer = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, Math.max(1, timeoutMs));

    socket.on('connect', () => {
      clearTimeout(timer);
      socket.end();
      resolve(true);
    });
    socket.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
  });
}

async function waitForTcpReady(host, port, maxWaitMs) {
  const start = Date.now();
  while (Date.now() - start < Math.max(0, maxWaitMs)) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await isTcpReachable(host, port, 200);
    if (ok) {
      return true;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForReceipt(provider, txHash, maxWaitMs, pollIntervalMs) {
  const startMs = Date.now();
  while (Date.now() - startMs < Math.max(0, maxWaitMs)) {
    // Hardhat's v6 provider doesn't implement waitForTransaction, but does implement receipt polling.
    // eslint-disable-next-line no-await-in-loop
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      return receipt;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return null;
}

async function main() {
  const sourceAppAddress = process.env.ODIN_SOURCE_APP;
  const sourceMiddlewareAddress = process.env.ODIN_SOURCE_MIDDLEWARE;
  const echoAppAddress = process.env.ODIN_ECHO_APP;
  const payloadText = process.env.ODIN_PAYLOAD;

  if (!sourceAppAddress || !sourceMiddlewareAddress || !echoAppAddress || !payloadText) {
    throw new Error(
      'Missing one or more required env vars: ODIN_SOURCE_APP, ODIN_SOURCE_MIDDLEWARE, ODIN_ECHO_APP, ODIN_PAYLOAD'
    );
  }

  const submitMode = (process.env.ODIN_SUBMIT_MODE || 'relay').trim().toLowerCase();
  console.log(`ODIN_ACTION_SUBMIT_MODE=${submitMode}`);
  const diagDir = process.env.ODIN_DIAG_DIR ? path.resolve(process.env.ODIN_DIAG_DIR) : '';
  const namespace = process.env.ODIN_SOLO_NAMESPACE || '';
  const rpcUrl = process.env.ODIN_RPC_URL || 'http://127.0.0.1:7546';
  const mirrorUrl = process.env.ODIN_MIRROR_URL || 'http://127.0.0.1:8080';

  const configuredGasLimit = parseOptionalInt(process.env.ODIN_GAS_LIMIT);
  const txWaitMs = parseOptionalInt(process.env.ODIN_TX_WAIT_MS) || 120000;

  const [signer] = await ethers.getSigners();

  const SourceAppFactory = await ethers.getContractFactory('SourceApplication');
  const sourceApp = SourceAppFactory.attach(sourceAppAddress);

  // Resolve the mock queue from the middleware (IT1 mock queue requires explicit response delivery).
  const MiddlewareFactory = await ethers.getContractFactory('ClprMiddleware');
  const sourceMiddleware = MiddlewareFactory.attach(sourceMiddlewareAddress);
  const queueAddress = await sourceMiddleware.queue();
  const QueueFactory = await ethers.getContractFactory('MockClprQueue');
  const queue = QueueFactory.attach(queueAddress);

  const payloadBytes = ethers.toUtf8Bytes(payloadText);
  const data = sourceApp.interface.encodeFunctionData('send', [payloadBytes]);

  let tx;
  if (submitMode === 'hapi-ethereum') {
    const hederaNodeUrl = process.env.ODIN_HEDERA_NODE_URL || '127.0.0.1:50211';
    const hederaNodeAccountId = process.env.ODIN_HEDERA_NODE_ACCOUNT_ID || '0.0.3';
    const operatorId = process.env.OPERATOR_ID_A;
    const operatorKeyDer = (process.env.OPERATOR_KEY_A || '').trim();
    const signerPrivateKeyHex = (process.env.PRIVATE_KEYS || '').split(',')[0]?.trim();

    if (!operatorId || !operatorKeyDer || !signerPrivateKeyHex) {
      throw new Error('Missing OPERATOR_ID_A/OPERATOR_KEY_A/PRIVATE_KEYS for HAPI Ethereum submission');
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    const nonce = await provider.getTransactionCount(new ethers.Wallet(signerPrivateKeyHex).address);
    const feeData = await provider.getFeeData();
    if (!feeData.gasPrice) {
      throw new Error('Unable to resolve gasPrice from JSON-RPC provider fee data');
    }
    const gasPrice = feeData.gasPrice.toString();

    const gasLimit = configuredGasLimit || 5_000_000;

    tx = await sendViaHapiEthereum({
      rpcUrl,
      hederaNodeUrl,
      hederaNodeAccountId,
      soloNamespace: namespace,
      operatorId,
      operatorKeyDer,
      signerPrivateKeyHex,
      txTo: sourceAppAddress,
      txData: data,
      gasLimit,
      gasPrice,
      chainId,
      nonce,
    });
  } else if (submitMode === 'relay') {
    tx = await sendViaRelay({
      signer,
      txTo: sourceAppAddress,
      txData: data,
      gasLimit: configuredGasLimit,
    });
    console.log(`ODIN_ACTION_TX_HASH=${tx.hash}`);
  } else {
    throw new Error(`Unknown ODIN_SUBMIT_MODE: ${submitMode}`);
  }

  console.log(`ODIN_ACTION_SOURCE_APP=${sourceAppAddress}`);
  console.log(`ODIN_ACTION_PAYLOAD=${payloadText}`);

  const receipt = await waitForReceipt(ethers.provider, tx.hash, txWaitMs, 1000);
  if (receipt) {
    console.log(`ODIN_ACTION_BLOCK_NUMBER=${receipt.blockNumber}`);
    console.log(`ODIN_ACTION_RECEIPT_STATUS=${receipt.status}`);
  } else {
    console.log('ODIN_ACTION_BLOCK_NUMBER=');
    console.log('ODIN_ACTION_RECEIPT_STATUS=');
  }

  if (receipt && receipt.status === 0) {
    await captureDiagnostics(diagDir, namespace, rpcUrl, mirrorUrl, tx.hash);
  }

  // Deliver any queued responses back to the source middleware.
  const deliverTx = await signer.sendTransaction({
    to: queueAddress,
    data: queue.interface.encodeFunctionData('deliverAllMessageResponses', []),
  });
  console.log(`ODIN_ACTION_DELIVER_TX_HASH=${deliverTx.hash}`);
  const deliverWaitMs = parseOptionalInt(process.env.ODIN_DELIVER_TX_WAIT_MS) || 30000;
  await withTimeout(deliverTx.wait(), deliverWaitMs, 'deliverAllMessageResponses tx.wait');

  let lastSentAppMessageId = '';
  if (receipt && receipt.logs) {
    for (const log of receipt.logs) {
      if (!log?.address) continue;
      if (log.address.toLowerCase() !== sourceAppAddress.toLowerCase()) continue;
      try {
        const parsed = sourceApp.interface.parseLog(log);
        if (parsed && parsed.name === 'SendAttempted') {
          lastSentAppMessageId = parsed.args.appMsgId.toString();
          break;
        }
      } catch (_err) {
        // ignore non-matching logs
      }
    }
  }
  console.log(`ODIN_ACTION_LAST_SENT_APP_MESSAGE_ID=${lastSentAppMessageId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
