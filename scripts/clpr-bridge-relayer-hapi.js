// SPDX-License-Identifier: Apache-2.0

/**
 * CLPR two-ledger relay runner over HAPI/gRPC (no JSON-RPC relay dependency).
 *
 * This script:
 * 1) sends N messages from source SourceApplication.send(bytes),
 * 2) relays request bytes src->dst via MockClprRelayedQueue.deliverInboundMessage(...),
 * 3) relays response bytes dst->src via MockClprRelayedQueue.deliverInboundResponse(...),
 * 4) verifies destination EchoApplication.requestCount advanced and
 *    source queue inboundResponseDelivered(lastMessageId) == true.
 *
 * Required env (either explicit IDs or CLPR_DEPLOYMENT_JSON):
 *   CLPR_SRC_OPERATOR_KEY
 *   CLPR_DST_OPERATOR_KEY
 *
 * Optional env:
 *   CLPR_SRC_OPERATOR_ID (default: 0.0.2)
 *   CLPR_DST_OPERATOR_ID (default: 0.0.2)
 *   CLPR_SRC_NODE_ACCOUNT_ID (default: 0.0.3)
 *   CLPR_DST_NODE_ACCOUNT_ID (default: 0.0.3)
 *   CLPR_SRC_GRPC_URL (default: 127.0.0.1:50211)
 *   CLPR_DST_GRPC_URL (default: 127.0.0.1:60011)
 *
 *   CLPR_DEPLOYMENT_JSON
 *     If set, reads IDs from the ODIN deployer output shape:
 *       src.queueContractId
 *       src.sourceApplicationContractId
 *       dst.queueContractId
 *       dst.echoApplicationContractId
 *
 *   or explicit IDs:
 *     CLPR_SRC_QUEUE_ID
 *     CLPR_DST_QUEUE_ID
 *     CLPR_SRC_SOURCE_APP_ID
 *     CLPR_DST_ECHO_APP_ID
 *
 *   CLPR_MESSAGE_COUNT (default: 3)
 *   CLPR_MESSAGE_PREFIX (default: clpr-js-relay-msg-)
 *   CLPR_QUERY_GAS (default: 1500000)
 *   CLPR_EXEC_GAS (default: 3000000)
 *   CLPR_POLL_MS (default: 500)
 *   CLPR_TIMEOUT_MS (default: 60000)
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');
const {
  AccountId,
  Client,
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractId,
  Hbar,
  PrivateKey,
} = require('@hashgraph/sdk');

const env = (key, defaultValue = '') =>
  process.env[key] && process.env[key].trim() !== ''
    ? process.env[key].trim()
    : defaultValue;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parsePrivateKey = (raw) => {
  const normalized = raw.trim().replace(/^0x/i, '');
  try {
    return PrivateKey.fromStringDer(normalized);
  } catch (derErr) {
    try {
      return PrivateKey.fromString(normalized);
    } catch (genericErr) {
      throw new Error(
        `Unable to parse private key. DER parse error=${derErr.message}; generic parse error=${genericErr.message}`
      );
    }
  }
};

const splitHostPort = (hostPort) => {
  const [host, portRaw] = hostPort.split(':');
  if (!host || !portRaw) {
    throw new Error(`Invalid host:port value: ${hostPort}`);
  }
  const port = Number(portRaw);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid port in host:port value: ${hostPort}`);
  }
  return { host, port };
};

const createClient = ({
  grpcUrl,
  nodeAccountId,
  operatorId,
  operatorKey,
}) => {
  const { host, port } = splitHostPort(grpcUrl);
  const client = Client.forNetwork({ [`${host}:${port}`]: nodeAccountId });
  client.setOperator(AccountId.fromString(operatorId), parsePrivateKey(operatorKey));
  return client;
};

const loadArtifact = (relativePath) => {
  const fullPath = path.join(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
};

const isExpectedMissingDataRevert = (error) => {
  const msg = String(error?.message || error || '');
  return (
    msg.includes('CONTRACT_REVERT_EXECUTED') ||
    msg.includes('MessageNotFound') ||
    msg.includes('ResponseNotFound')
  );
};

const decodeSingleResult = (iface, fnName, encodedBytes) => {
  const decoded = iface.decodeFunctionResult(fnName, encodedBytes);
  return decoded.length === 1 ? decoded[0] : decoded;
};

const callView = async ({
  client,
  contractId,
  iface,
  fnName,
  args = [],
  gas,
}) => {
  const callData = iface.encodeFunctionData(fnName, args);
  const result = await new ContractCallQuery()
    .setContractId(ContractId.fromString(contractId))
    .setGas(gas)
    .setQueryPayment(new Hbar(2))
    .setFunctionParameters(ethers.getBytes(callData))
    .execute(client);

  const raw = ethers.hexlify(result.asBytes());
  return decodeSingleResult(iface, fnName, raw);
};

const executeTx = async ({
  client,
  contractId,
  iface,
  fnName,
  args = [],
  gas,
}) => {
  const callData = iface.encodeFunctionData(fnName, args);
  const tx = await new ContractExecuteTransaction()
    .setContractId(ContractId.fromString(contractId))
    .setGas(gas)
    .setFunctionParameters(ethers.getBytes(callData))
    .execute(client);
  const receipt = await tx.getReceipt(client);
  const status = receipt.status.toString();
  if (status !== 'SUCCESS') {
    throw new Error(
      `Execute failed: ${contractId}.${fnName} status=${status} txId=${tx.transactionId?.toString() || '<unknown>'}`
    );
  }
  return tx.transactionId?.toString() || '<unknown>';
};

const waitForBytes = async ({
  readFn,
  timeoutMs,
  pollMs,
  label,
}) => {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const bytes = await readFn();
      return bytes;
    } catch (error) {
      if (!isExpectedMissingDataRevert(error)) {
        throw error;
      }
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timeout waiting for ${label}`);
      }
      await sleep(pollMs);
    }
  }
};

const normalizeHexBytes = (value) => {
  if (typeof value === 'string') return value;
  return ethers.hexlify(value);
};

const toNumber = (value) => Number(BigInt(value.toString()));

const loadDeployment = () => {
  const deploymentJsonPath = env('CLPR_DEPLOYMENT_JSON', '');
  if (!deploymentJsonPath) {
    return {
      srcQueueId: env('CLPR_SRC_QUEUE_ID', ''),
      dstQueueId: env('CLPR_DST_QUEUE_ID', ''),
      srcSourceAppId: env('CLPR_SRC_SOURCE_APP_ID', ''),
      dstEchoAppId: env('CLPR_DST_ECHO_APP_ID', ''),
    };
  }

  const fullPath = path.isAbsolute(deploymentJsonPath)
    ? deploymentJsonPath
    : path.join(process.cwd(), deploymentJsonPath);
  const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  return {
    srcQueueId: json?.src?.queueContractId || '',
    dstQueueId: json?.dst?.queueContractId || '',
    srcSourceAppId: json?.src?.sourceApplicationContractId || '',
    dstEchoAppId: json?.dst?.echoApplicationContractId || '',
  };
};

async function main() {
  const srcGrpc = env('CLPR_SRC_GRPC_URL', '127.0.0.1:50211');
  const dstGrpc = env('CLPR_DST_GRPC_URL', '127.0.0.1:60011');
  const srcNodeAccountId = env('CLPR_SRC_NODE_ACCOUNT_ID', '0.0.3');
  const dstNodeAccountId = env('CLPR_DST_NODE_ACCOUNT_ID', '0.0.3');
  const srcOperatorId = env('CLPR_SRC_OPERATOR_ID', '0.0.2');
  const dstOperatorId = env('CLPR_DST_OPERATOR_ID', '0.0.2');
  const srcOperatorKey = env('CLPR_SRC_OPERATOR_KEY', '');
  const dstOperatorKey = env('CLPR_DST_OPERATOR_KEY', '');

  if (!srcOperatorKey || !dstOperatorKey) {
    throw new Error(
      'Missing operator keys. Set CLPR_SRC_OPERATOR_KEY and CLPR_DST_OPERATOR_KEY.'
    );
  }

  const deployment = loadDeployment();
  const srcQueueId = deployment.srcQueueId;
  const dstQueueId = deployment.dstQueueId;
  const srcSourceAppId = deployment.srcSourceAppId;
  const dstEchoAppId = deployment.dstEchoAppId;

  if (!srcQueueId || !dstQueueId || !srcSourceAppId || !dstEchoAppId) {
    throw new Error(
      'Missing contract ids. Provide CLPR_DEPLOYMENT_JSON or explicit CLPR_*_ID values.'
    );
  }

  const messageCount = Number(env('CLPR_MESSAGE_COUNT', '3'));
  const messagePrefix = env('CLPR_MESSAGE_PREFIX', 'clpr-js-relay-msg-');
  const queryGas = Number(env('CLPR_QUERY_GAS', '1500000'));
  const execGas = Number(env('CLPR_EXEC_GAS', '3000000'));
  const pollMs = Number(env('CLPR_POLL_MS', '500'));
  const timeoutMs = Number(env('CLPR_TIMEOUT_MS', '60000'));

  const queueArtifact = loadArtifact(
    'artifacts/contracts/solidity/clpr/mocks/MockClprRelayedQueue.sol/MockClprRelayedQueue.json'
  );
  const sourceAppArtifact = loadArtifact(
    'artifacts/contracts/solidity/clpr/apps/SourceApplication.sol/SourceApplication.json'
  );
  const echoAppArtifact = loadArtifact(
    'artifacts/contracts/solidity/clpr/apps/EchoApplication.sol/EchoApplication.json'
  );

  const queueIface = new ethers.Interface(queueArtifact.abi);
  const sourceAppIface = new ethers.Interface(sourceAppArtifact.abi);
  const echoAppIface = new ethers.Interface(echoAppArtifact.abi);

  const srcClient = createClient({
    grpcUrl: srcGrpc,
    nodeAccountId: srcNodeAccountId,
    operatorId: srcOperatorId,
    operatorKey: srcOperatorKey,
  });
  const dstClient = createClient({
    grpcUrl: dstGrpc,
    nodeAccountId: dstNodeAccountId,
    operatorId: dstOperatorId,
    operatorKey: dstOperatorKey,
  });

  try {
    const startNextMessageId = BigInt(
      (
        await callView({
          client: srcClient,
          contractId: srcQueueId,
          iface: queueIface,
          fnName: 'nextMessageId',
          args: [],
          gas: queryGas,
        })
      ).toString()
    );

    const dstRequestCountBefore = BigInt(
      (
        await callView({
          client: dstClient,
          contractId: dstEchoAppId,
          iface: echoAppIface,
          fnName: 'requestCount',
          args: [],
          gas: queryGas,
        })
      ).toString()
    );

    console.log(
      `Start state: src.nextMessageId=${startNextMessageId} dst.requestCount=${dstRequestCountBefore}`
    );

    const relayedMessageIds = [];
    for (let i = 1; i <= messageCount; i++) {
      const payloadText = `${messagePrefix}${i}`;
      const payloadBytes = ethers.toUtf8Bytes(payloadText);
      const txId = await executeTx({
        client: srcClient,
        contractId: srcSourceAppId,
        iface: sourceAppIface,
        fnName: 'send',
        args: [payloadBytes],
        gas: execGas,
      });
      const messageId = startNextMessageId + BigInt(i);
      relayedMessageIds.push(messageId);
      console.log(
        `Sent source messageId=${messageId.toString()} payload="${payloadText}" txId=${txId}`
      );
    }

    for (const messageId of relayedMessageIds) {
      const messageIdNum = toNumber(messageId);

      const outboundRequestBytes = await waitForBytes({
        label: `src.getOutboundMessageBytes(${messageIdNum})`,
        timeoutMs,
        pollMs,
        readFn: async () =>
          normalizeHexBytes(
            await callView({
              client: srcClient,
              contractId: srcQueueId,
              iface: queueIface,
              fnName: 'getOutboundMessageBytes',
              args: [messageIdNum],
              gas: queryGas,
            })
          ),
      });

      const tx1 = await executeTx({
        client: dstClient,
        contractId: dstQueueId,
        iface: queueIface,
        fnName: 'deliverInboundMessage',
        args: [messageIdNum, outboundRequestBytes],
        gas: execGas,
      });
      console.log(
        `Relayed src->dst messageId=${messageIdNum} txId=${tx1}`
      );

      const pendingResponseBytes = await waitForBytes({
        label: `dst.getPendingResponseBytes(${messageIdNum})`,
        timeoutMs,
        pollMs,
        readFn: async () =>
          normalizeHexBytes(
            await callView({
              client: dstClient,
              contractId: dstQueueId,
              iface: queueIface,
              fnName: 'getPendingResponseBytes',
              args: [messageIdNum],
              gas: queryGas,
            })
          ),
      });

      const tx2 = await executeTx({
        client: srcClient,
        contractId: srcQueueId,
        iface: queueIface,
        fnName: 'deliverInboundResponse',
        args: [pendingResponseBytes],
        gas: execGas,
      });
      console.log(
        `Relayed dst->src messageId=${messageIdNum} txId=${tx2}`
      );
    }

    const lastMessageId = relayedMessageIds[relayedMessageIds.length - 1];
    const inboundDelivered = await callView({
      client: srcClient,
      contractId: srcQueueId,
      iface: queueIface,
      fnName: 'inboundResponseDelivered',
      args: [toNumber(lastMessageId)],
      gas: queryGas,
    });

    const dstRequestCountAfter = BigInt(
      (
        await callView({
          client: dstClient,
          contractId: dstEchoAppId,
          iface: echoAppIface,
          fnName: 'requestCount',
          args: [],
          gas: queryGas,
        })
      ).toString()
    );

    const expectedRequestCount = dstRequestCountBefore + BigInt(messageCount);
    const deliveredBool = Boolean(inboundDelivered);
    const countOk = dstRequestCountAfter === expectedRequestCount;

    console.log(
      `Final state: dst.requestCount=${dstRequestCountAfter} expected=${expectedRequestCount} src.inboundResponseDelivered(${lastMessageId})=${deliveredBool}`
    );

    if (!deliveredBool || !countOk) {
      throw new Error(
        `Verification failed: delivered=${deliveredBool}, countOk=${countOk}`
      );
    }

    console.log('PASS: JS HAPI relay completed successfully.');
  } finally {
    srcClient.close();
    dstClient.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
