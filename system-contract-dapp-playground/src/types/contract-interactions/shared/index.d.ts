// SPDX-License-Identifier: Apache-2.0

/** @dev an interface for transaction results when interacting with smart contracts. */
export interface ITransactionResult {
  status: 'success' | 'fail';
  txHash: string;
  APICalled?: any;
  tokenInfo?: any;
  tokenID?: string;
  isToken?: boolean;
  readonly?: boolean;
  selected?: boolean;
  keyTypeCalled?: any;
  recordIndex?: number;
  tokenAddress?: string;
  mintedAmount?: string;
  initialAmount?: string;
  accountAddress?: string;
  transferAmount?: string;
  transactionType: string;
  convertedAmount?: string;
  receiverAddress?: string;
  pseudoRandomSeed?: string;
  tokenAddresses?: string[];
  transactionTimeStamp: number;
  sessionedContractAddress: string;
  transactionResultStorageKey: string;
  ercTokenInfo?: {
    name?: string;
    symbol?: string;
    decimals?: string;
    totalSupply?: string;
  };
  balanceOf?: {
    owner: string;
    balance: number;
  };
  allowances?: {
    owner: string;
    spender: string;
    amount: number;
  };
  tokenURI?: {
    tokenID: string;
    tokenURI: string;
  };
  ownerOf?: {
    tokenID: string;
    owner: string;
  };
  approves?: {
    tokenID: string;
    spender: string;
  };
  approval?: {
    owner: string;
    status: boolean;
    operator: string;
  };
}

/** @dev an interface for the results returned back from interacting with Hedera System Smart Contracts */
interface ISmartContractExecutionResult {
  Frozen?: any;
  IsToken?: any;
  Approved?: any;
  TokenType?: any;
  KycGranted?: any;
  result?: boolean;
  AllowanceValue?: any;
  ApprovedAddress?: any;
  tokenAddress?: string;
  convertedAmount?: number;
  transactionHash?: string;
  pseudoRandomSeed?: string;
  TokenDefaultKycStatus?: any;
  TokenDefaultFreezeStatus?: any;
  TokenInfo?: IHederaTokenServiceTokenInfo;
  TokenKey?: IHederaTokenServiceKeyValueType;
  TokenExpiryInfo?: IHederaTokenServiceExpiry;
  FungibleTokenInfo?: IHederaTokenServiceFungibleTokenInfo;
  NonFungibleTokenInfo?: IHederaTokenServiceNonFungibleTokenInfo;
  TokenCustomFees?: {
    fixedFees: IHederaTokenServiceFixedFee[];
    royaltyFees: IHederaTokenServiceRoyaltyFee[];
    fractionalFees: IHederaTokenServiceFractionalFee[];
  };
  err?: any;
}
