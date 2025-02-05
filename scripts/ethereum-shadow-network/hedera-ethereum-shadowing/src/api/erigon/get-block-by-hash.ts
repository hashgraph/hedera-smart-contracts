import { axiosInstanceErigon, axiosInstanceHederaRpcApi } from '@/api/config';
import { isAxiosError } from 'axios';

export async function getBlockByHashErigon(
	blockHash: string
): Promise<any> {
	try {
		const response = await axiosInstanceErigon.post('', {
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
		if (isAxiosError(error)) {
			console.error('Error fetching raw transaction:', error.response?.data);
			throw new Error(
				'Error fetching raw transaction: ' +
					JSON.stringify(error.response?.data)
			);
		} else {
			// if error not axios error, use generic error
			console.error('Unknown error:', error);
			throw new Error(
				'Error fetching raw transaction: ' +
					(error instanceof Error ? error.message : String(error))
			);
		}
	}
}

export async function getBlockByHashHedera(
	blockHash: string
): Promise<any> {
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
		if (isAxiosError(error)) {
			console.error('Error fetching raw transaction:', error.response?.data);
			throw new Error(
				'Error fetching raw transaction: ' +
					JSON.stringify(error.response?.data)
			);
		} else {
			// if error not axios error, use generic error
			console.error('Unknown error:', error);
			throw new Error(
				'Error fetching raw transaction: ' +
					(error instanceof Error ? error.message : String(error))
			);
		}
	}
}
