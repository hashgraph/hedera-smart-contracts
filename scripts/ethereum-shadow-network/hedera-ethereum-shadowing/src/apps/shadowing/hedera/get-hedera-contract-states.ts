import { getContractState } from "@/api/hedera-mirror-node/get-contract-state";

export class StateData {
	slot: string;
	value: string;

	constructor(_slot: string, _value: string) {
		this.slot = _slot;
		this.value = _value;
	}
}

export async function getHederaContractStates(contractAddress: string): Promise<StateData[]> {
	let states: StateData[] = [];
	const data = await getContractState(contractAddress);
	if (data && data.state) {
		for (const state of data.state) {
			const stateSlot = state.slot;
			const stateValue = state.value;
			states.push(new StateData(stateSlot, stateValue))
		}
	}
	return states;
}
