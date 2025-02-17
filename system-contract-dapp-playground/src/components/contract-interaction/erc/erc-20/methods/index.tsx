// SPDX-License-Identifier: Apache-2.0

import Mint from './mint';
import { Contract } from 'ethers';
import BalanceOf from './balance-of';
import Transfer from './token-transfer';
import TokenPermission from './token-permission';
import TokenInformation from './token-information';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const ERC20Methods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'mint' && <Mint baseContract={baseContract} />}
      {method === 'transfer' && <Transfer baseContract={baseContract} />}
      {method === 'balanceOf' && <BalanceOf baseContract={baseContract} />}
      {method === 'tokenPermissions' && <TokenPermission baseContract={baseContract} />}
      {method === 'tokenInformation' && <TokenInformation baseContract={baseContract} />}
    </>
  );
};

export default ERC20Methods;
