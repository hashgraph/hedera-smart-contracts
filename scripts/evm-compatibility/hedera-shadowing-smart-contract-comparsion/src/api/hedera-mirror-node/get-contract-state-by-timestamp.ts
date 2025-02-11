import axios from 'axios';
import { StateData } from '@/utils/types';

const MIRROR_NODE_API_HOST = process.env.MIRROR_NODE_API_HOST;
export async function getContractStateByTimestamp(contractAddress: any, timestamp: any) {
	let url = `http://${MIRROR_NODE_API_HOST}:5551/api/v1/contracts/${contractAddress}/state?timestamp=${timestamp}`;
	let stateData: StateData[] = [];
		try {
			const response = await axios.get(url);
			stateData = response.data.state;
		} catch (error) {
			return [];
		}
	return stateData;
}
