// SPDX-License-Identifier: Apache-2.0

/**
 * Minimal CLPR stand-in relayer for two separated ledgers.
 *
 * This relayer watches the source ledger queue outbox (`MockClprRelayedQueue`) and forwards:
 * 1) outbound request bytes -> destination queue `deliverInboundMessage(...)`
 * 2) resulting response bytes -> source queue `deliverInboundResponse(...)`
 *
 * Usage (example):
 *   export CLPR_SRC_RPC_URL=http://127.0.0.1:7546
 *   export CLPR_DST_RPC_URL=http://127.0.0.1:7547
 *   export CLPR_SRC_QUEUE_ADDRESS=0x...
 *   export CLPR_DST_QUEUE_ADDRESS=0x...
 *   export CLPR_PRIVATE_KEY=0x...
 *
 *   npx hardhat run scripts/clpr-bridge-relayer.js --network hardhat
 */

const hre = require('hardhat');
const { ethers } = require('ethers');

const env = (key, defaultValue) =>
  process.env[key] && process.env[key].trim() !== ''
    ? process.env[key].trim()
    : defaultValue;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const srcRpcUrl = env('CLPR_SRC_RPC_URL', 'http://127.0.0.1:7546');
  const dstRpcUrl = env('CLPR_DST_RPC_URL', 'http://127.0.0.1:7547');
  const srcQueueAddress = env('CLPR_SRC_QUEUE_ADDRESS', '');
  const dstQueueAddress = env('CLPR_DST_QUEUE_ADDRESS', '');

  if (!srcQueueAddress || !dstQueueAddress) {
    throw new Error(
      'Missing queue addresses. Set CLPR_SRC_QUEUE_ADDRESS and CLPR_DST_QUEUE_ADDRESS.'
    );
  }

  const privateKey = env(
    'CLPR_PRIVATE_KEY',
    (env('PRIVATE_KEYS', '').split(',')[0] || '').trim()
  );
  if (!privateKey) {
    throw new Error(
      'Missing private key. Set CLPR_PRIVATE_KEY or PRIVATE_KEYS in the environment.'
    );
  }

  const pollMs = Number(env('CLPR_POLL_MS', '1000'));
  const gasLimit = Number(env('CLPR_RELAYER_GAS_LIMIT', '12000000'));

  const queueArtifact = await hre.artifacts.readArtifact('MockClprRelayedQueue');

  const srcProvider = new ethers.JsonRpcProvider(srcRpcUrl);
  const dstProvider = new ethers.JsonRpcProvider(dstRpcUrl);
  await Promise.all([srcProvider.getBlockNumber(), dstProvider.getBlockNumber()]);

  const wallet = new ethers.Wallet(privateKey);
  const srcSigner = wallet.connect(srcProvider);
  const dstSigner = wallet.connect(dstProvider);

  const srcQueue = new ethers.Contract(
    srcQueueAddress,
    queueArtifact.abi,
    srcSigner
  );
  const dstQueue = new ethers.Contract(
    dstQueueAddress,
    queueArtifact.abi,
    dstSigner
  );

  let nextToRelay = BigInt(env('CLPR_START_MESSAGE_ID', '1'));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const latest = await srcQueue.nextMessageId();
    while (nextToRelay <= latest) {
      const messageId = nextToRelay;
      const messageBytes = await srcQueue.getOutboundMessageBytes(messageId);

      const tx1 = await dstQueue.deliverInboundMessage(messageId, messageBytes, {
        gasLimit,
      });
      await tx1.wait();

      const responseBytes = await dstQueue.getPendingResponseBytes(messageId);
      const tx2 = await srcQueue.deliverInboundResponse(responseBytes, {
        gasLimit,
      });
      await tx2.wait();

      nextToRelay = messageId + 1n;
      console.log(`Relayed messageId=${messageId.toString()}`);
    }

    await sleep(pollMs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

