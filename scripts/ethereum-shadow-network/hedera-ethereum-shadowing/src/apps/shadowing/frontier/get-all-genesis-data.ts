// SPDX-License-Identifier: Apache-2.0

import genesis from '@/genesis_block_transactions.json';
import { Genesis } from '@/utils/types';

export class GenesisData {
	toAccount: string;
	amount: number;

	constructor(_toAccount: string, _amount: number) {
		this.toAccount = _toAccount;
		this.amount = _amount;
	}
}

export function getAllGenesisData() {
	let genesisData: Genesis[] = [];
	genesis.map((element) => {
		let genData = new GenesisData(element.to, element.amount);
		genesisData.push(genData);
	});
	return genesisData;
}
