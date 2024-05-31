const dotenv = require('dotenv');

dotenv.config();

export const HEDERA_NETWORK = process.env.HEDERA_NETWORK || '';
export const HEDERA_MIRRORNODE = process.env.HEDERA_MIRRORNODE || '';
export const HEDERA_OPERATOR_ID = process.env.HEDERA_OPERATOR_ID || '';
export const HEDERA_OPERATOR_KEY = process.env.HEDERA_OPERATOR_KEY || '';
export const QUERY_HBAR_PAYMENT  = parseInt(process.env.QUERY_HBAR_PAYMENT || '');
export const QUERY_GAS = parseInt(process.env.QUERY_GAS || '');
