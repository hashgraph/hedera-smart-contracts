import {HederaTransactionsResponse} from '@/utils/types';
import axios from 'axios';
import {errorHandler} from '@/utils/helpers/api/error-handler';


export async function getHederaTransactionById(hederaTransactionId: string): Promise<HederaTransactionsResponse['transactions'][number] | undefined> {
    let url = `http://localhost:5551/api/v1/transactions/${hederaTransactionId}`;
    try {
        const response = await axios.get(url);
        const data = await response.data;
        return data.transactions[0]
    } catch (error) {
        errorHandler(error, 'Error getting transaction id');
    }
}
