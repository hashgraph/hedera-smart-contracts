import axios from 'axios';
import { StateData } from '@/utils/types';

export async function getContractStateByTimestamp(
	contractAddress: any,
	timestamp: any
) {
	let url = `http://localhost:5551/api/v1/contracts/${contractAddress}/state?timestamp=${timestamp}`;
	let stateData: StateData[] = [];
	try {
		const response = await axios.get(url);
		stateData = response.data.state;
	} catch (error) {
		return [];
	}
	return stateData;
}
