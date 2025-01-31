import { axiosInstanceErigon } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

export async function getUncleByBlockNumberAndIndex(
	blockNumber: string,
	index: string
): Promise<any> {
	try {
		const response = await axiosInstanceErigon.post('', {
			method: 'eth_getUncleByBlockNumberAndIndex',
			params: ['0x' + blockNumber, '0x' + index],
			id: 1,
			jsonrpc: '2.0',
		});

		if (response.data && response.data.result) {
			return response.data.result;
		}
	} catch (error) {
		errorHandler(error, 'Error in getUncleByBlockNumberAndIndex');
	}
}
