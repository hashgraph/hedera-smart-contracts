// SPDX-License-Identifier: Apache-2.0

import { Contract } from 'ethers';
import QueryTokenValidity from './queryTokenValidity';
import QueryTokenStatusInfomation from './queryTokenStatus';
import QueryTokenSpecificInfomation from './querySpecificToken';
import QueryTokenGeneralInfomation from './queryTokenGeneralInfo';
import QueryTokenPermissionInfomation from './queryTokenPermission';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenQueryMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'tokenValidity' && <QueryTokenValidity baseContract={baseContract} />}
      {method === 'generalInfo' && <QueryTokenGeneralInfomation baseContract={baseContract} />}
      {method === 'specificInfo' && <QueryTokenSpecificInfomation baseContract={baseContract} />}
      {method === 'tokenStatus' && <QueryTokenStatusInfomation baseContract={baseContract} />}
      {method === 'tokenPermission' && <QueryTokenPermissionInfomation baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenQueryMethods;
