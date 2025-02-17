// SPDX-License-Identifier: Apache-2.0

/**
 * @notice this scripts is mainly designed to freeze the local network node to prepare for network migration (mono to mod)
 */
const {
  FreezeTransaction,
  Client,
  Timestamp,
  FreezeType,
} = require('@hashgraph/sdk');
const { OPERATOR_ID_A, OPERATOR_KEY_A } = require('../utils/constants');

async function main() {
  try {
    // notice: currently this setup is only used to freeze a single network node locally.
    const genesisClient = Client.forNetwork({
      '127.0.0.1:50211': '0.0.3',
    }).setOperator(OPERATOR_ID_A, OPERATOR_KEY_A);

    const validStart = new Timestamp(Math.round((Date.now() + 5000) / 1000), 0); // timestamp now +  5 sec
    const tx = new FreezeTransaction()
      .setStartTimestamp(validStart)
      .setFreezeType(new FreezeType(1)) // FreezeOnly
      .freezeWith(genesisClient);
    const execTx = await tx.execute(genesisClient);
    await execTx.getReceipt(genesisClient);
  } catch (e) {
    if (e.message.includes('GrpcServiceError: read ECONNRESET')) {
      console.log('The platform has been frozen successfully.');
    } else {
      throw new Error(e);
    }
  }

  process.exit(0);
}

main().catch((error) => {
  console.log(error);
  process.exit(-1);
});
