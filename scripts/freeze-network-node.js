/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
