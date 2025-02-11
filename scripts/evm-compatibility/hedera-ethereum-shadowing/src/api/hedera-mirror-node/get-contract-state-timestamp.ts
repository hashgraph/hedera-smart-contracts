import axios from 'axios';

export async function getContractStateTimestamp(contractAddress: any, timestamp: any) {
	let url = `http://localhost:5551/api/v1/contracts/${contractAddress}/state?timestamp=${timestamp}`;
	let stateData: any[] = [];
	while (url) {
		try {
			const response = await axios.get(url);
			const data = response.data;
			stateData = stateData.concat(data.state);
			url = data.links.next;
		} catch (error) {
			console.error('Error fetching contract state:', error);
			return [];
		}
	}
	return stateData;
}
