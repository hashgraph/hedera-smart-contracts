// SPDX-License-Identifier: Apache-2.0

export function convertIntoPrevBlockNumber(blockNumber: string) {
	const prevBlockNumberDec = parseInt(blockNumber, 16) - 1;
	return prevBlockNumberDec.toString(16);
}
