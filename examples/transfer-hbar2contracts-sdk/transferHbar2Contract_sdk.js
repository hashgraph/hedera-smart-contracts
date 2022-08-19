console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	AccountCreateTransaction,
	Hbar,
	ContractCallQuery,
	TransferTransaction,
	ContractInfoQuery,
	ContractCreateFlow,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const aliceKey = PrivateKey.generateED25519();
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
	// Create additional accounts needed
	const initialBalance = 100;
	const [accStatus, aliceId] = await accountCreatorFcn(aliceKey, initialBalance);
	console.log(
		`\n- Created Alice's account '${aliceId}' with initial balance of ${initialBalance} hbar: ${accStatus}`
	);

	// Import the compiled contract bytecode
	const contractBytecode = fs.readFileSync("hbar2Contract.bin");

	// Deploy the contract on Hedera
	const [contractId, contractAddress] = await contractCreatorFcn(contractBytecode);
	console.log(`\n- The smart contract ID is: ${contractId}`);
	console.log(`- The smart contract ID in Solidity format is: ${contractAddress}`);

	// Transfer HBAR to smart contract using TransferTransaction()
	const hbarAmount = 10;
	const transferRx = await hbarTransferFcn(aliceId, contractId, hbarAmount);
	console.log(`\n- Transfer ${hbarAmount} HBAR from Alice to contract: ${transferRx.status}`);

	// Query the contract balance
	const [fromCallQuery, fromInfoQuery] = await contractBalanceCheckerFcn(contractId);
	console.log(`\n- Contract balance (from getBalance fcn): ${fromCallQuery} tinybars`);
	console.log(`- Contract balance (from ContractInfoQuery): ${fromInfoQuery.balance.toString()}`);
}

async function accountCreatorFcn(pvKey, iBal) {
	const response = await new AccountCreateTransaction()
		.setInitialBalance(new Hbar(iBal))
		.setKey(pvKey.publicKey)
		.execute(client);
	const receipt = await response.getReceipt(client);
	return [receipt.status, receipt.accountId];
}

async function contractCreatorFcn(contractBytecode) {
	const contractDeployTx = await new ContractCreateFlow()
		.setBytecode(contractBytecode)
		.setGas(100000)
		.execute(client);
	const contractDeployRx = await contractDeployTx.getReceipt(client);
	const contractId = contractDeployRx.contractId;
	const contractAddress = contractId.toSolidityAddress();
	return [contractId, contractAddress];
}

async function hbarTransferFcn(sender, receiver, amount) {
	const transferTx = new TransferTransaction()
		.addHbarTransfer(sender, -amount)
		.addHbarTransfer(receiver, amount)
		.freezeWith(client);
	const transferSign = await transferTx.sign(aliceKey);
	const transferSubmit = await transferSign.execute(client);
	const transferRx = await transferSubmit.getReceipt(client);
	return transferRx;
}

async function contractBalanceCheckerFcn(contractId) {
	const contractQueryTx = new ContractCallQuery()
		.setContractId(contractId)
		.setGas(100000)
		.setFunction("getBalance");
	const contractQuerySubmit = await contractQueryTx.execute(client);
	const contractQueryResult = contractQuerySubmit.getUint256(0);

	const cCheck = await new ContractInfoQuery().setContractId(contractId).execute(client);
	return [contractQueryResult, cCheck];
}

main();
