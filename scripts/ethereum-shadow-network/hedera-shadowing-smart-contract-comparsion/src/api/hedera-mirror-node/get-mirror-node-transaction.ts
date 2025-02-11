import axios from 'axios';
import { getCurrentTimestamp } from '@/utils/helpers/get-current-unix-timestamp';

const MIRROR_NODE_API_HOST = process.env.MIRROR_NODE_API_HOST;
export async function getMirrorNodeTransaction(
	hederaTransactionHash: string
): Promise<any> {
	if (hederaTransactionHash === undefined) {
		return getCurrentTimestamp();
	}

	const url = `http://${MIRROR_NODE_API_HOST}:5551/api/v1/transactions/${hederaTransactionHash}`;

	try {
		const response = await axios.get(url);
		if (response.data) {
			return response.data.transactions[0];
		}
	} catch (error) {
		console.error('Error fetching transaction:', JSON.stringify(error));
		// if error, return default time stamp
		return getCurrentTimestamp();
	}
}
