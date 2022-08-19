console.clear();
require("dotenv").config();
const {
	AccountId,
	PrivateKey,
	Client,
	ContractFunctionParameters,
	ContractExecuteTransaction,
	ContractCallQuery,
	TransferTransaction,
	ContractInfoQuery,
	ContractCreateFlow,
	Hbar,
	AccountCreateTransaction,
} = require("@hashgraph/sdk");
const fs = require("fs");

// Configure accounts and client
const operatorId = AccountId.fromString(process.env.OPERATOR_ID);
const operatorKey = PrivateKey.fromString(process.env.OPERATOR_PVKEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
	// Create other necessary accounts
	console.log(`\n- Creating accounts...`);
	const initBalance = 100;
	const treasuryKey = PrivateKey.generateED25519();
	const [treasuryAccSt, treasuryId] = await accountCreatorFcn(treasuryKey, initBalance);
	console.log(`- Created Treasury account ${treasuryId} that has a balance of ${initBalance} ℏ`);

	const aliceKey = PrivateKey.generateED25519();
	const [aliceAccSt, aliceId] = await accountCreatorFcn(aliceKey, initBalance);
	console.log(`- Created Alice's account ${aliceId} that has a balance of ${initBalance} ℏ`);

	// Import the compiled contract bytecode
	const contractBytecode = fs.readFileSync("hbarToAndFromContract.bin");

	// Deploy the smart contract on Hedera
	console.log(`\n- Deploying contract...`);
	let gasLimit = 100000;

	const [contractId, contractAddress] = await contractDeployFcn(contractBytecode, gasLimit);
	console.log(`- The smart contract ID is: ${contractId}`);
	console.log(`- The smart contract ID in Solidity format is: ${contractAddress}`);

	const tokenId = AccountId.fromString("0.0.47931765");
	console.log(`\n- Token ID (for association with contract later): ${tokenId}`);

	console.log(`
====================================================
GETTING HBAR TO THE CONTRACT
====================================================`);

	// Transfer HBAR to the contract using .setPayableAmount WITHOUT specifying a function (fallback/receive triggered)
	let payableAmt = 10;
	console.log(`- Caller (Operator) PAYS ${payableAmt} ℏ to contract (fallback/receive)...`);
	const toContractRx = await contractExecuteNoFcn(contractId, gasLimit, payableAmt);

	// Get contract HBAR balance by calling the getBalance function in the contract AND/OR using ContractInfoQuery in the SDK
	await contractCallQueryFcn(contractId, gasLimit, "getBalance"); // Outputs the contract balance in the console

	// Transfer HBAR to the contract using .setPayableAmount SPECIFYING a contract function (tokenAssociate)
	payableAmt = 21;
	gasLimit = 800000;
	console.log(`\n- Caller (Operator) PAYS ${payableAmt} ℏ to contract (payable function)...`);
	const Params = await contractParamsBuilderFcn(contractId, [], 2, tokenId);
	const Rx = await contractExecuteFcn(contractId, gasLimit, "tokenAssociate", Params, payableAmt);

	gasLimit = 50000;
	await contractCallQueryFcn(contractId, gasLimit, "getBalance"); // Outputs the contract balance in the console

	// Transfer HBAR from the Treasury to the contract deployed using the SDK
	let moveAmt = 30;
	const transferSdkRx = await hbar2ContractSdkFcn(treasuryId, contractId, moveAmt, treasuryKey);
	console.log(`\n- ${moveAmt} ℏ from Treasury to contract (via SDK): ${transferSdkRx.status}`);

	await contractCallQueryFcn(contractId, gasLimit, "getBalance"); // Outputs the contract balance in the console

	console.log(`
====================================================
GETTING HBAR FROM THE CONTRACT
====================================================`);

	payableAmt = 0;
	moveAmt = 20;

	console.log(`- Contract TRANSFERS ${moveAmt} ℏ to Alice...`);
	const tParams = await contractParamsBuilderFcn(aliceId, moveAmt, 3, []);
	const tRx = await contractExecuteFcn(contractId, gasLimit, "transferHbar", tParams, payableAmt);

	// Get contract HBAR balance by calling the getBalance function in the contract AND/OR using ContractInfoQuery in the SDK
	await showContractBalanceFcn(contractId); // Outputs the contract balance in the console

	console.log(`\n- Contract SENDS ${moveAmt} ℏ to Alice...`);
	const sParams = await contractParamsBuilderFcn(aliceId, moveAmt, 3, []);
	const sRx = await contractExecuteFcn(contractId, gasLimit, "sendHbar", sParams, payableAmt);

	await showContractBalanceFcn(contractId); // Outputs the contract balance in the console

	console.log(`\n- Contract CALLS ${moveAmt} ℏ to Alice...`);
	const cParams = await contractParamsBuilderFcn(aliceId, moveAmt, 3, []);
	const cRx = await contractExecuteFcn(contractId, gasLimit, "callHbar", cParams, payableAmt);

	await showContractBalanceFcn(contractId); // Outputs the contract balance in the console

	console.log(`\n- SEE THE TRANSACTION HISTORY IN HASHSCAN (FOR CONTRACT AND OPERATOR): 
https://hashscan.io/#/testnet/contract/${contractId}
https://hashscan.io/#/testnet/account/${operatorId}`);

	console.log(`
====================================================
🎉🎉 THE END - NOW JOIN: https://hedera.com/discord
====================================================\n`);
}
main();

// ==================================================
// FUNCTIONS
// ==================================================

async function accountCreatorFcn(pvKey, iBal) {
	const response = await new AccountCreateTransaction()
		.setInitialBalance(new Hbar(iBal))
		.setKey(pvKey.publicKey)
		.execute(client);
	const receipt = await response.getReceipt(client);
	return [receipt.status, receipt.accountId];
}

async function contractDeployFcn(bytecode, gasLim) {
	const contractCreateTx = new ContractCreateFlow().setBytecode(bytecode).setGas(gasLim);
	const contractCreateSubmit = await contractCreateTx.execute(client);
	const contractCreateRx = await contractCreateSubmit.getReceipt(client);
	const contractId = contractCreateRx.contractId;
	const contractAddress = contractId.toSolidityAddress();
	return [contractId, contractAddress];
}

async function contractExecuteNoFcn(cId, gasLim, amountHbar) {
	const contractExecuteTx = new ContractExecuteTransaction()
		.setContractId(cId)
		.setGas(gasLim)
		.setPayableAmount(amountHbar);
	const contractExecuteSubmit = await contractExecuteTx.execute(client);
	const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
	return contractExecuteRx;
}

async function contractCallQueryFcn(cId, gasLim, fcnName) {
	const contractQueryTx = new ContractCallQuery()
		.setContractId(cId)
		.setGas(gasLim)
		.setFunction(fcnName);
	const contractQuerySubmit = await contractQueryTx.execute(client);
	const contractQueryResult = contractQuerySubmit.getUint256(0);
	console.log(`- Contract balance (getBalance fcn): ${contractQueryResult * 1e-8} ℏ`);
}

async function contractParamsBuilderFcn(aId, amountHbar, section, tId) {
	let builtParams = [];
	if (section === 2) {
		builtParams = new ContractFunctionParameters()
			.addAddress(aId.toSolidityAddress())
			.addAddress(tId.toSolidityAddress());
	} else if (section === 3) {
		builtParams = new ContractFunctionParameters()
			.addAddress(aId.toSolidityAddress())
			.addUint256(amountHbar * 1e8);
	} else {
	}
	return builtParams;
}

async function contractExecuteFcn(cId, gasLim, fcnName, params, amountHbar) {
	const contractExecuteTx = new ContractExecuteTransaction()
		.setContractId(cId)
		.setGas(gasLim)
		.setFunction(fcnName, params)
		.setPayableAmount(amountHbar);
	const contractExecuteSubmit = await contractExecuteTx.execute(client);
	const contractExecuteRx = await contractExecuteSubmit.getReceipt(client);
	return contractExecuteRx;
}

async function hbar2ContractSdkFcn(sender, receiver, amount, pKey) {
	const transferTx = new TransferTransaction()
		.addHbarTransfer(sender, -amount)
		.addHbarTransfer(receiver, amount)
		.freezeWith(client);
	const transferSign = await transferTx.sign(pKey);
	const transferSubmit = await transferSign.execute(client);
	const transferRx = await transferSubmit.getReceipt(client);
	return transferRx;
}

async function showContractBalanceFcn(cId) {
	const info = await new ContractInfoQuery().setContractId(cId).execute(client);
	console.log(`- Contract balance (ContractInfoQuery SDK): ${info.balance.toString()}`);
}
