import { axiosInstanceErigon } from '@/api/config';
import { errorHandler } from '@/utils/helpers/api/error-handler';

export async function getTransactionReceipt(txHash: string): Promise<any> {
	try {
		const response = await axiosInstanceErigon.post('', {
			method: 'eth_getTransactionReceipt',
			params: [`${txHash}`],
			id: 1,
			jsonrpc: '2.0',
		});

		if (response.data && response.data.result) {
			console.log(response.data.result);
			return response.data.result;
		}
	} catch (error) {
		errorHandler(error, 'Error in getTransactionReceipt');
	}
}
