import axios from 'axios';

export async function getContractState(contractAddress: any) {
	let url = `http://localhost:5551/api/v1/contracts/${contractAddress}/state`;
	try {
		const response = await axios.get(url);
		if (response.data) {
			return response.data;
		}
	}
	catch (error) {
		return undefined;
	}
}
