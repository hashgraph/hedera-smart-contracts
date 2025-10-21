// SPDX-License-Identifier: Apache-2.0

import { axiosInstanceErigon } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

export async function getStorageAt(
	contractAddress: string,
	position: string,
	blockNumber: string
): Promise<any> {
	try {
		const response = await axiosInstanceErigon.post('', {
			method: 'eth_getStorageAt',
			params: [`${contractAddress}`, `${position}`, `0x${blockNumber}`],
			id: 1,
			jsonrpc: '2.0',
		});


		if (response.data && response.data.result) {

			return response.data.result;
		}
	} catch (error) {
		errorHandler(error, 'getStorageAt');
	}
}
