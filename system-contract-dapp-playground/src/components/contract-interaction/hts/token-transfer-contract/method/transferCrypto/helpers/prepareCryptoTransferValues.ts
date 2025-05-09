// SPDX-License-Identifier: Apache-2.0

import { CryptoTransferParam, TokenTransferParam } from './generateInitialValues';

interface CryptoTransferPageProps {
  contractCaller: string;
  cryptoTransferParamValues: CryptoTransferParam[];
}

export const prepareCryptoTransferList = ({
  contractCaller,
  cryptoTransferParamValues,
}: CryptoTransferPageProps) => {
  // prepare total amount
  const amountArray = cryptoTransferParamValues.map((prev) => Number(prev.fieldValue.amount));
  const amountTotal = amountArray.reduce((sum, curVal) => sum + curVal, 0);

  let cryptoTransfers: IHederaTokenServiceAccountAmount[] = [
    {
      accountID: contractCaller,
      amount: amountTotal * -1,
      isApproval: false,
    },
  ];

  cryptoTransferParamValues.forEach((prev) => {
    cryptoTransfers.push({
      accountID: prev.fieldValue.accountID,
      amount: Number(prev.fieldValue.amount),
      isApproval: prev.fieldValue.isApprovalA,
    });
  });

  return {
    transfers: cryptoTransfers,
  };
};

interface TokenTransferPageProps {
  tokenTransferParamValues: TokenTransferParam[];
  contractCaller: string;
}

export const prepareTokenTransferList = ({
  tokenTransferParamValues,
  contractCaller,
}: TokenTransferPageProps) => {
  let tokenTransferList: IHederaTokenServiceTokenTransferList[] = [];
  tokenTransferParamValues.forEach((tokenTransferParamValue) => {
    if (tokenTransferParamValue.fieldValue.tokenType === 'FUNGIBLE') {
      // prepare total amount
      let amountsArray = [] as number[];
      tokenTransferParamValue.fieldValue.transfers.forEach((transfer) => {
        amountsArray.push(Number(transfer.fieldValue.amount));
      });

      const amountsTotal = amountsArray.reduce((sum, curVal) => sum + curVal, 0);

      let tokenTransfers = [
        {
          accountID: contractCaller,
          amount: amountsTotal * -1,
          isApproval: false,
        },
      ];

      tokenTransferParamValue.fieldValue.transfers.forEach((transfer) => {
        tokenTransfers.push({
          accountID: transfer.fieldValue.accountID,
          amount: Number(transfer.fieldValue.amount),
          isApproval: transfer.fieldValue.isApprovalA,
        });
      });

      tokenTransferList.push({
        token: tokenTransferParamValue.fieldValue.token,
        transfers: tokenTransfers,
        nftTransfers: [],
      });
    } else {
      let nftTransfers = [] as IHederaTokenServiceNftTransfer[];
      tokenTransferParamValue.fieldValue.nftTransfers.forEach((transfer) => {
        nftTransfers.push({
          senderAccountID: transfer.fieldValue.senderAccountID,
          receiverAccountID: transfer.fieldValue.receiverAccountID,
          serialNumber: Number(transfer.fieldValue.serialNumber),
          isApproval: transfer.fieldValue.isApprovalB,
        });
      });
      tokenTransferList.push({
        token: tokenTransferParamValue.fieldValue.token,
        transfers: [],
        nftTransfers,
      });
    }
  });
  return tokenTransferList;
};
