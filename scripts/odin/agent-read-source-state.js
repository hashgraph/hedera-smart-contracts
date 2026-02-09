// SPDX-License-Identifier: Apache-2.0

const { ethers } = require('hardhat');

const DEFAULT_LOG_LOOKBACK = 10_000;

async function main() {
  const sourceAppAddress = process.env.ODIN_SOURCE_APP;
  if (!sourceAppAddress) {
    throw new Error('Missing required env var: ODIN_SOURCE_APP');
  }

  const lookback = process.env.ODIN_LOG_LOOKBACK
    ? Number(process.env.ODIN_LOG_LOOKBACK)
    : DEFAULT_LOG_LOOKBACK;
  if (!Number.isFinite(lookback) || lookback <= 0) {
    throw new Error(`Invalid ODIN_LOG_LOOKBACK: ${process.env.ODIN_LOG_LOOKBACK}`);
  }

  const SourceAppFactory = await ethers.getContractFactory('SourceApplication');
  const sourceApp = SourceAppFactory.attach(sourceAppAddress);

  const toBlock = await ethers.provider.getBlockNumber();
  const fromBlock = Math.max(0, toBlock - lookback);

  const responseEvents = await sourceApp.queryFilter(
    sourceApp.filters.ResponseReceived(),
    fromBlock,
    toBlock
  );
  const latestResponse = responseEvents.length > 0 ? responseEvents[responseEvents.length - 1] : null;
  const responseCount = BigInt(responseEvents.length);
  const lastResponseAppMessageId = latestResponse ? latestResponse.args.appMsgId : 0n;
  const payloadHex = latestResponse ? latestResponse.args.payload : '0x';

  const sendEvents = await sourceApp.queryFilter(
    sourceApp.filters.SendAttempted(),
    fromBlock,
    toBlock
  );
  const latestSend = sendEvents.length > 0 ? sendEvents[sendEvents.length - 1] : null;
  const lastSentAppMessageId = latestSend ? latestSend.args.appMsgId : 0n;

  let payloadUtf8 = '';
  if (payloadHex && payloadHex !== '0x') {
    try {
      payloadUtf8 = ethers.toUtf8String(payloadHex);
    } catch (_err) {
      payloadUtf8 = '';
    }
  }

  console.log(`ODIN_STATE_SOURCE_APP=${sourceAppAddress}`);
  console.log(`ODIN_STATE_RESPONSE_COUNT=${responseCount.toString()}`);
  // IT1 does not track a per-response success bit; treat "response was delivered" as success for this probe.
  console.log(`ODIN_STATE_LAST_RESPONSE_SUCCESS=${responseCount > 0n}`);
  console.log(`ODIN_STATE_LAST_RESPONSE_APP_MESSAGE_ID=${lastResponseAppMessageId.toString()}`);
  console.log(`ODIN_STATE_LAST_SENT_APP_MESSAGE_ID=${lastSentAppMessageId.toString()}`);
  console.log(`ODIN_STATE_LAST_RESPONSE_PAYLOAD=${payloadUtf8}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
