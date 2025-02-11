import { axiosInstanceErigon } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

export async function getLastBlockNumber(): Promise<any> {
	try {
		const response = await axiosInstanceErigon.post('', {
			method: 'eth_blockNumber',
			params: [],
			id: 1,
			jsonrpc: '2.0',
		});

		if (response.data && response.data.result) {
			return response.data.result;
		}
	} catch (error) {
		errorHandler(error, 'Error fetching last block number');
	}
}
