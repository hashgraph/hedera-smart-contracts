import { axiosInstanceHederaRpcApi } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

// TODO to type promise response objects
export async function getTransaction(txnHash: string): Promise<any> {
	try {
		const response = await axiosInstanceHederaRpcApi.post('', {
			method: 'eth_getTransactionByHash',
			params: [txnHash],
			id: 1,
			jsonrpc: '2.0',
		});

		if (response.data && response.data.result) {
			console.log(response.data.result);
			return response.data.result;
		} else {
			throw new Error('No result found in response');
		}
	} catch (error) {
		errorHandler(error, 'error in getTransaction');
	}
}
