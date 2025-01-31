import { getTransaction } from "@/api/hedera/get-transaction";
import { createEthereumTransaction } from "../shadowing/ethereum/create-ethereum-transaction";
import { sendHbarToAlias } from "../shadowing/transfers/send-hbar-to-alias";
import { getHederaContractStatesByTimestamp } from "../shadowing/hedera/get-hedera-contract-states-by-timestamp";
import { AccountId, Client } from "@hashgraph/sdk";

export async function compareContractRootStates(accountId: AccountId, client: Client, nodeAccountId: AccountId ) {

    const transactions = [
        '0xe98581212aa2c1435c2749783ae8def0c4ca9ba681fcede0aeeeeba769dc7c8c',
        '0x542d340f54848bb0322dbe1f2618c83f9a38f0afc5bf4a69394ceeb9dc2ba82c',
        '0x7ec3c550ea14ee20c826692c55381e0388c16c24c564ec19a993a70969728561',
        '0x3418231facfa836713a781c0ecf244b572da45efd5a5ae5f74deb8bac148e20a',
        '0xb30eb164082574fe31e6d393c21100b3201791d2983b370462ae35a01f5f7d58',
        '0x63137f76f3e1cde3f08b8c2e16ba2bdce6f066f9c76c115ec0f73e2d05c20a47',
        '0xb1a55386e3e47f1a29e792f73335d4b55cd4a93301cdf869ff03b1ee3b6249a9',
        '0x3e610dc7b6858a200bf999e22e57a7e572cf02145a564ca170b6061c2d79fddc',
        '0x8b8897f701ed97e90a173a91b4f9ee6e777701200f3a6bbcbfb70934c0ee803c',
        '0x6497aeb9fa780f7503c66fbb2d61b3d66e8418a9a024c02cc40faf8ff9e50018',
        '0x8f4de8d3491a4f3ffa01bf7bae022d83f6e7a0aa1df0c236953f4e7e37e92b89',
        '0x52e20b156b40a69d0c359b1f3b5cabfbbe86efc9a6cd5b3dcecadf8b525c36d3',

        '0x526879c40994e1761bcf0787371920f50b172ac423b6a4ad3871277fdc3d359c',

        '0xe98581212aa2c1435c2749783ae8def0c4ca9ba681fcede0aeeeeba769dc7c8c',
        '0x542d340f54848bb0322dbe1f2618c83f9a38f0afc5bf4a69394ceeb9dc2ba82c',
        '0xb1a55386e3e47f1a29e792f73335d4b55cd4a93301cdf869ff03b1ee3b6249a9',
        '0x3e610dc7b6858a200bf999e22e57a7e572cf02145a564ca170b6061c2d79fddc',
        '0x8b8897f701ed97e90a173a91b4f9ee6e777701200f3a6bbcbfb70934c0ee803c',
        '0x6497aeb9fa780f7503c66fbb2d61b3d66e8418a9a024c02cc40faf8ff9e50018',
        '0x8f4de8d3491a4f3ffa01bf7bae022d83f6e7a0aa1df0c236953f4e7e37e92b89',
        '0x84d434b3711f13ae60bfc38c8d92da3aeb439b8f423d4475f8789a1caa9d620e',

        // '0xd50a228ac5cfb06d45b91644828c1df464becd8fa341b4241d0d401cc0ef0343',
    ]

    await sendHbarToAlias(
        accountId,
        '0x105083929bF9bb22C26cB1777Ec92661170D4285',
        1000000000,
        client,
        0,
        nodeAccountId
    );

    await sendHbarToAlias(
        accountId,
        '0x84e9304FA9AAfc5e70090eAdDa9ac2C76D93Ad51',
        1000000000,
        client,
        0,
        nodeAccountId
    );

    for (const transaction of transactions) {
        const response = await createEthereumTransaction(
            {
                txHash: transaction,
                gas: 21000,
            },
            accountId,
            client,
            nodeAccountId,
            'transaction.to',
            0
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));
        const transactionDetails = await getTransaction(transaction)
        const lastTransactionTimestamp = transactionDetails.consensus_timestamp

        const possibleTransactionAddress = transactionDetails.to;
        const hederaStates = await getHederaContractStatesByTimestamp(possibleTransactionAddress, lastTransactionTimestamp);
        console.log(hederaStates, 'hederaStates');
    }
}