// SPDX-License-Identifier: Apache-2.0

const fs = require('fs');
const path = require('path');
const net = require('net');
const { spawn, spawnSync } = require('child_process');
const { ethers } = require('ethers');

const SECP256K1_DER_PREFIX = '3030020100300706052b8104000a04220420';
const DEFAULT_RPC_URL = 'http://127.0.0.1:7546';
const DEFAULT_MIRROR_URL = 'http://127.0.0.1:8080';
const DEFAULT_HEDERA_NODE_URL = '127.0.0.1:50211';
const DEFAULT_HEDERA_NODE_ACCOUNT_ID = '0.0.3';
const DEFAULT_DEPLOYMENT = 'odin-it1';
const MIRROR_INGRESS_CLASS = 'mirror-ingress-class';

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
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

function parseHttpHostPort(url) {
  const parsed = new URL(url);
  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  return { host: parsed.hostname, port };
}

function parseHostPort(value) {
  const parsed = /^(?<host>[^:]+):(?<port>\d+)$/.exec(value);
  if (!parsed) {
    throw new Error(`Invalid host:port value: ${value}`);
  }
  return { host: parsed.groups.host, port: Number(parsed.groups.port) };
}

function startPortForward({ namespace, target, localPort, remotePort }) {
  const child = spawn('kubectl', ['-n', namespace, 'port-forward', target, `${localPort}:${remotePort}`], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  child.unref();
  return child;
}

function runCommand(cmd, options = {}) {
  const result = spawnSync('/bin/zsh', ['-lc', cmd], {
    cwd: options.cwd || process.cwd(),
    env: options.env || process.env,
    encoding: 'utf8',
  });

  if (result.stdout && !options.silent) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr && !options.silent) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`Command failed (${result.status}): ${cmd}`);
  }

  return result;
}

function getArg(name, defaultValue = undefined) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) {
    return defaultValue;
  }
  if (idx + 1 >= process.argv.length) {
    throw new Error(`Missing value for ${name}`);
  }
  return process.argv[idx + 1];
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function requireJsonCommand(cmd, options = {}) {
  const result = runCommand(cmd, { ...options, silent: true });
  try {
    return JSON.parse(result.stdout);
  } catch (err) {
    throw new Error(`Failed to parse JSON from command: ${cmd}`);
  }
}

function tryJsonCommand(cmd, options = {}) {
  const result = runCommand(cmd, { ...options, silent: true, allowFailure: true });
  if (result.status !== 0) {
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (_err) {
    return null;
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function ensureRelayHealthy(rpcUrl) {
  const first = await postJson(rpcUrl, {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_blockNumber',
    params: [],
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  const second = await postJson(rpcUrl, {
    jsonrpc: '2.0',
    id: 2,
    method: 'eth_blockNumber',
    params: [],
  });

  if (!first.result || !second.result) {
    throw new Error('Relay did not return eth_blockNumber results');
  }

  console.log(`ODIN_SOLO_BLOCK_FIRST=${first.result}`);
  console.log(`ODIN_SOLO_BLOCK_SECOND=${second.result}`);
}

async function ensureMirrorHealthy(mirrorUrl) {
  const body = await getJson(`${mirrorUrl}/api/v1/network/nodes?limit=1`);
  if (!body || !Array.isArray(body.nodes)) {
    throw new Error('Mirror did not return expected /api/v1/network/nodes response');
  }
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

function findSoloNamespace(preferred) {
  if (preferred) {
    return preferred;
  }

  const services = requireJsonCommand('kubectl get svc -A -o json');
  const relayServices = services.items.filter((item) => item.metadata && item.metadata.name === 'relay-1');

  if (relayServices.length === 1) {
    return relayServices[0].metadata.namespace;
  }

  if (relayServices.length === 0) {
    throw new Error('No relay-1 service found in Kubernetes cluster');
  }

  const namespaces = relayServices.map((item) => item.metadata.namespace).join(', ');
  throw new Error(
    `Multiple relay namespaces found (${namespaces}). Re-run with --namespace <value> or ODIN_SOLO_NAMESPACE.`
  );
}

function ensureRequiredPodsRunning(namespace) {
  const pods = requireJsonCommand(`kubectl get pods -n ${shellQuote(namespace)} -o json`);

  const requiredPrefixes = ['relay-1-', 'mirror-1-rest-', 'network-node1-'];

  for (const prefix of requiredPrefixes) {
    const found = pods.items.some(
      (item) =>
        item.metadata?.name?.startsWith(prefix) &&
        item.status?.phase === 'Running'
    );
    if (!found) {
      throw new Error(`Required pod prefix ${prefix} not running in namespace ${namespace}`);
    }
  }
}

async function findFundedCredentials(namespace, mirrorUrl) {
  const secrets = requireJsonCommand(`kubectl get secrets -n ${shellQuote(namespace)} -o json`);
  const accountSecrets = secrets.items
    .map((item) => item.metadata?.name)
    .filter((name) => name && name.startsWith('account-key-'))
    .sort();

  for (const secretName of accountSecrets) {
    const secret = requireJsonCommand(
      `kubectl get secret -n ${shellQuote(namespace)} ${shellQuote(secretName)} -o json`
    );
    const privateKeyB64 = secret.data?.privateKey;
    if (!privateKeyB64) {
      continue;
    }

    const der = Buffer.from(privateKeyB64, 'base64').toString('utf8').trim();
    if (!der.startsWith(SECP256K1_DER_PREFIX)) {
      continue;
    }

    const raw = `0x${der.slice(-64)}`;
    let evmAddress;
    try {
      evmAddress = new ethers.Wallet(raw).address.toLowerCase();
    } catch (_err) {
      continue;
    }

    let account;
    try {
      account = await getJson(`${mirrorUrl}/api/v1/accounts/${evmAddress}`);
    } catch (_err) {
      continue;
    }
    if (!account || !account.account) {
      continue;
    }

    const balance = BigInt(account.balance?.balance || '0');
    if (balance <= 0n) {
      continue;
    }

    return {
      operatorId: account.account,
      operatorKeyDer: der,
      privateKeyRaw: raw,
      evmAddress,
      balance: balance.toString(),
      sourceSecret: secretName,
    };
  }

  throw new Error(`No funded ECDSA account found in namespace ${namespace}`);
}

function ensureMirrorIngressConfigured(namespace) {
  const ingressNames = ['mirror-1-rest', 'mirror-1-restjava', 'mirror-1-web3', 'mirror-1-grpc', 'mirror-1-monitor'];

  for (const name of ingressNames) {
    const ingress = tryJsonCommand(
      `kubectl get ingress -n ${shellQuote(namespace)} ${shellQuote(name)} -o json`
    );
    if (!ingress || !ingress.spec) {
      continue;
    }
    if (!ingress.spec.ingressClassName) {
      runCommand(
        `kubectl patch ingress -n ${shellQuote(namespace)} ${shellQuote(name)} --type='json' ` +
          `-p='[{"op":"add","path":"/spec/ingressClassName","value":"${MIRROR_INGRESS_CLASS}"}]'`,
        { silent: true }
      );
    }
  }

  // Ensure /api/v1 matches as a Prefix for HAProxy ingress (accounts endpoints are used by the relay).
  runCommand(
    `kubectl patch ingress -n ${shellQuote(namespace)} mirror-1-rest --type='json' ` +
      `-p='[{"op":"replace","path":"/spec/rules/0/http/paths/0/pathType","value":"Prefix"}]'`,
    { allowFailure: true, silent: true }
  );

  // Fix HAProxy path matching for relay fee lookups (mirror chart ships Traefik regex anchors).
  runCommand(
    `kubectl patch ingress -n ${shellQuote(namespace)} mirror-1-restjava --type='json' -p='[` +
      `{"op":"replace","path":"/spec/rules/0/http/paths/3/path","value":"/api/v1/network/fees"},` +
      `{"op":"replace","path":"/spec/rules/0/http/paths/3/pathType","value":"Prefix"},` +
      `{"op":"replace","path":"/spec/rules/0/http/paths/4/path","value":"/api/v1/network/stake"},` +
      `{"op":"replace","path":"/spec/rules/0/http/paths/4/pathType","value":"Prefix"}` +
      `]'`,
    { allowFailure: true, silent: true }
  );
}

function ensurePredefinedAccounts(rootDir, deploymentName, namespace) {
  const secrets = requireJsonCommand(`kubectl get secrets -n ${shellQuote(namespace)} -o json`, { silent: true });
  const hasAccountSecrets = secrets.items.some((item) => item.metadata?.name?.startsWith('account-key-'));
  if (hasAccountSecrets) {
    return;
  }
  // This command prints private keys; keep it silent.
  runCommand(`solo ledger account predefined -q -d ${shellQuote(deploymentName)}`, { cwd: rootDir, silent: true });
}

async function main() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const platformDir = path.resolve(
    getArg('--platform-dir', process.env.ODIN_PLATFORM_DIR || path.resolve(rootDir, '..', 'hiero-autonomous-agent-platform'))
  );
  const defaultConfigDir = (() => {
    const it1 = path.join(rootDir, 'test/odin/clpr/it1');
    const it0 = path.join(rootDir, 'test/odin/clpr/it0');
    return fs.existsSync(it1) ? it1 : it0;
  })();
  const configDir = path.resolve(getArg('--config-dir', defaultConfigDir));

  const runtimeDir = path.join(configDir, 'runtime');
  const deploymentFile = path.join(runtimeDir, 'deployment.properties');
  const resultFile = path.join(runtimeDir, 'odin-result.json');
  const logFile = path.join(runtimeDir, 'odin-runner.log');
  const localJarPath = path.join(rootDir, 'tools/odin/lib/odin-it1-runner.jar');
  const builtJarPathPreferred = path.join(platformDir, 'build/libs/odin-it1-runner.jar');
  const builtJarPathLegacy = path.join(platformDir, 'build/libs/odin-it0-runner.jar');

  const deploymentName = getArg('--deployment', process.env.ODIN_SOLO_DEPLOYMENT || DEFAULT_DEPLOYMENT);
  const rpcUrl = getArg('--rpc-url', process.env.ODIN_RPC_URL || DEFAULT_RPC_URL);
  const mirrorUrl = getArg('--mirror-url', process.env.ODIN_MIRROR_URL || DEFAULT_MIRROR_URL);
  const hederaNodeUrl = getArg('--hedera-node-url', process.env.ODIN_HEDERA_NODE_URL || DEFAULT_HEDERA_NODE_URL);
  const hederaNodeAccountId = getArg(
    '--hedera-node-account-id',
    process.env.ODIN_HEDERA_NODE_ACCOUNT_ID || DEFAULT_HEDERA_NODE_ACCOUNT_ID
  );

  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.mkdirSync(path.dirname(localJarPath), { recursive: true });

  if (hasFlag('--fresh')) {
    console.log('ODIN: Performing SOLO fresh reset');
    runCommand('solo one-shot single destroy -q', { cwd: rootDir, allowFailure: true });
    // One-shot deploy can fail late (e.g. relay readiness) but still leave a usable cluster behind.
    runCommand(`solo one-shot single deploy -q -d ${shellQuote(deploymentName)}`, { cwd: rootDir, allowFailure: true });
  }

  const namespace = findSoloNamespace(getArg('--namespace', process.env.ODIN_SOLO_NAMESPACE));
  console.log(`ODIN_SOLO_NAMESPACE=${namespace}`);

  ensureRequiredPodsRunning(namespace);

  const portForwards = [];

  try {
    // Patch mirror ingresses if needed (SOLO v0.55.0 / HAProxy ingress-class mismatch).
    ensureMirrorIngressConfigured(namespace);

    // Ensure required localhost endpoints exist (start port-forwards only when needed).
    const { host: rpcHost, port: rpcPort } = parseHttpHostPort(rpcUrl);
    if (!(await isTcpReachable(rpcHost, rpcPort, 300))) {
      const child = startPortForward({ namespace, target: 'svc/relay-1', localPort: rpcPort, remotePort: 7546 });
      portForwards.push(child);
      if (!(await waitForTcpReady(rpcHost, rpcPort, 5000))) {
        throw new Error(`Timed out waiting for relay port-forward on ${rpcHost}:${rpcPort}`);
      }
    }

    const { host: mirrorHost, port: mirrorPort } = parseHttpHostPort(mirrorUrl);
    if (!(await isTcpReachable(mirrorHost, mirrorPort, 300))) {
      const child = startPortForward({
        namespace,
        target: 'svc/mirror-ingress-controller',
        localPort: mirrorPort,
        remotePort: 80,
      });
      portForwards.push(child);
      if (!(await waitForTcpReady(mirrorHost, mirrorPort, 5000))) {
        throw new Error(`Timed out waiting for mirror port-forward on ${mirrorHost}:${mirrorPort}`);
      }
    }

    const { host: hederaHost, port: hederaPort } = parseHostPort(hederaNodeUrl);
    if (!(await isTcpReachable(hederaHost, hederaPort, 300))) {
      const child = startPortForward({
        namespace,
        target: 'pod/network-node1-0',
        localPort: hederaPort,
        remotePort: 50211,
      });
      portForwards.push(child);
      if (!(await waitForTcpReady(hederaHost, hederaPort, 5000))) {
        throw new Error(`Timed out waiting for gRPC port-forward on ${hederaHost}:${hederaPort}`);
      }
    }

    // Ensure mirror + relay are usable before deploying.
    await ensureMirrorHealthy(mirrorUrl);
    await ensureRelayHealthy(rpcUrl);

    // Ensure `account-key-*` secrets exist so we can pick a funded ECDSA operator for Hardhat.
    ensurePredefinedAccounts(rootDir, deploymentName, namespace);

    const creds = await findFundedCredentials(namespace, mirrorUrl);
    console.log(`ODIN_OPERATOR_ID=${creds.operatorId}`);
    console.log(`ODIN_OPERATOR_EVM=${creds.evmAddress}`);
    console.log(`ODIN_OPERATOR_BALANCE=${creds.balance}`);
    console.log(`ODIN_OPERATOR_SECRET=${creds.sourceSecret}`);

    const runnerEnv = {
      ...process.env,
      OPERATOR_ID_A: creds.operatorId,
      OPERATOR_KEY_A: creds.operatorKeyDer,
      PRIVATE_KEYS: creds.privateKeyRaw,
      ODIN_SOLO_NAMESPACE: namespace,
      ODIN_DIAG_DIR: runtimeDir,
      ODIN_RPC_URL: rpcUrl,
      ODIN_MIRROR_URL: mirrorUrl,
      // Hedera SDK (HAPI) default for SOLO port-forwarding.
      ODIN_HEDERA_NODE_URL: hederaNodeUrl,
      ODIN_HEDERA_NODE_ACCOUNT_ID: hederaNodeAccountId,
    };

    runCommand(
      `ODIN_OUTPUT_FILE=${shellQuote(deploymentFile)} npx hardhat run scripts/odin/deploy-clpr-it1.js --network local --no-compile`,
      { cwd: rootDir, env: runnerEnv }
    );

    runCommand(`${shellQuote(path.join(platformDir, 'scripts/build-jar.sh'))}`, {
      cwd: platformDir,
    });

    const builtJarPath = fs.existsSync(builtJarPathPreferred) ? builtJarPathPreferred : builtJarPathLegacy;
    if (!fs.existsSync(builtJarPath)) {
      throw new Error(`Expected built jar not found: ${builtJarPathPreferred} (or legacy ${builtJarPathLegacy})`);
    }

    fs.copyFileSync(builtJarPath, localJarPath);
    console.log(`ODIN_BUILT_JAR=${builtJarPath}`);
    console.log(`ODIN_COPIED_JAR=${localJarPath}`);

    // Allow failure so we can still read the structured result file and provide a useful error message.
    runCommand(
      `java -jar ${shellQuote(localJarPath)} --config-dir ${shellQuote(configDir)} --deployment-file ${shellQuote(deploymentFile)} --result-file ${shellQuote(resultFile)} --log-file ${shellQuote(logFile)}`,
      { cwd: rootDir, env: runnerEnv, allowFailure: true }
    );

    if (!fs.existsSync(resultFile)) {
      throw new Error(`Runner result file missing: ${resultFile}`);
    }

    const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
    if (!result.passed) {
      throw new Error(`ODIN run failed. See ${resultFile} and ${logFile}`);
    }

    console.log(`ODIN_RESULT=${result.status || 'PASS'}`);
    console.log(`ODIN_RESULT_FILE=${resultFile}`);
    console.log(`ODIN_LOG_FILE=${logFile}`);
  } finally {
    for (const child of portForwards) {
      try {
        child.kill('SIGTERM');
      } catch (_e) {
        // ignore
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
