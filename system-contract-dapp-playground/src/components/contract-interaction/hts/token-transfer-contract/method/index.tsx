// SPDX-License-Identifier: Apache-2.0

import { Contract } from 'ethers';
import CryptoTransfer from './transferCrypto';
import TransferSingleToken from './transferSingleToken';
import TransferMultipleTokens from './transferMultipleTokens';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenTransferMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'transferFrom' && <>{method}</>}
      {method === 'crypto' && <CryptoTransfer baseContract={baseContract} />}
      {method === 'transferToken' && <TransferSingleToken baseContract={baseContract} />}
      {method === 'transferTokens' && <TransferMultipleTokens baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenTransferMethods;
