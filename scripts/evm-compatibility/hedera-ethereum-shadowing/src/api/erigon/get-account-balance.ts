import { axiosInstanceErigon } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

export async function getAccountBalance(address: string, blockNumber: string) {
	try {
		const response = await axiosInstanceErigon.post('', {
			method: 'eth_getBalance',
			params: [address, `0x${blockNumber}`],
			id: 1,
			jsonrpc: '2.0',
		});

		if (response.data && response.data.result) {
			return response.data.result;
		}
	} catch (error) {
		errorHandler(error, 'Error getting account balance');
	}
}
