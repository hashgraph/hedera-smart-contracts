import { axiosInstanceHederaRpcApi } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

export async function getBlockByHashHedera(blockHash: string): Promise<any> {
	try {
		const response = await axiosInstanceHederaRpcApi.post('', {
			method: 'eth_getBlockByHash',
			params: [`${blockHash}`, false],
			id: 1,
			jsonrpc: '2.0',
		});

		if (response.data && response.data.result) {
			console.log(response.data.result);
			return response.data.result;
		}
	} catch (error) {
		errorHandler(error, 'Error getBlockByHashHedera');
	}
}
