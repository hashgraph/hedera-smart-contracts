import { getContractStateByTimestamp } from '@/api/hedera-mirror-node/get-contract-state-by-timestamp';
import { StateData } from '@/utils/types';

export async function getHederaContractStatesByTimestamp(
	contractAddress: string,
	timestamp: string
): Promise<StateData[]> {
	const data = await getContractStateByTimestamp(contractAddress, timestamp);
	return data
		? data.map(({ slot, value, timestamp, address }) => ({
				address,
				timestamp,
				slot,
				value,
			}))
		: [];
}
