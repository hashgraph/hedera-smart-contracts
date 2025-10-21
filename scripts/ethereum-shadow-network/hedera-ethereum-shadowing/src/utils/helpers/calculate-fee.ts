// SPDX-License-Identifier: Apache-2.0

export function calculateFee(gas: string, gasPrice: string) {
	const fee = parseInt(gas) * parseInt(gasPrice);
	console.log(`fee for transaction ${fee}`);
	return fee;
}
