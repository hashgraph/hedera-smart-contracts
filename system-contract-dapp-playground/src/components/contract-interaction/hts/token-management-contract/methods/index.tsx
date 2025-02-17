// SPDX-License-Identifier: Apache-2.0

import { Contract } from 'ethers';
import ManageTokenInfo from './manageTokenInfo';
import ManageTokenStatus from './manageTokenStatus';
import ManageTokenDelete from './manageTokenDelete';
import ManageTokenRelation from './manageTokenRelation';
import ManageTokenPermission from './manageTokenPermission';
import ManageTokenDeduction from './manageTokenSupplyReduction';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenManagementMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'tokenStatus' && <ManageTokenStatus baseContract={baseContract} />}
      {method === 'tokenDelete' && <ManageTokenDelete baseContract={baseContract} />}
      {method === 'tokenInformation' && <ManageTokenInfo baseContract={baseContract} />}
      {method === 'tokenRelation' && <ManageTokenRelation baseContract={baseContract} />}
      {method === 'tokenPermission' && <ManageTokenPermission baseContract={baseContract} />}
      {method === 'tokenSupplyReduction' && <ManageTokenDeduction baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenManagementMethods;
