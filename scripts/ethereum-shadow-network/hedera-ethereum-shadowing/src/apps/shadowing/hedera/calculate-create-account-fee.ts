import { AccountId, AccountInfoQuery, Client } from '@hashgraph/sdk';
import { getOperatorAccountBalance } from '@/apps/shadowing/hedera/get-operator-account-balance';

export async function calculateCreateAccountFee(accountId: AccountId, client: Client, accountBalanceBefore: number, amount: number) {
	const accountBalance = await getOperatorAccountBalance(accountId, client);
	const balanceAfterCreateWithoutFee = accountBalanceBefore - amount
	return accountBalance - balanceAfterCreateWithoutFee;
}
