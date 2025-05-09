// SPDX-License-Identifier: Apache-2.0

import { Contract } from 'ethers';
import GrantTokenKYC from './GrantTokenKYC';
import MintHederaToken from './MintHederaToken';
import FungibleTokenCreate from './FungibleTokenCreate';
import AssociateHederaToken from './AssociateHederaToken';
import NonFungibleTokenCreate from './NonFungibleTokenCreate';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenCreateMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'mint' && <MintHederaToken baseContract={baseContract} />}
      {method === 'grantKYC' && <GrantTokenKYC baseContract={baseContract} />}
      {method === 'tokenAssociation' && <AssociateHederaToken baseContract={baseContract} />}
      {method === 'fungibleTokenCreate' && <FungibleTokenCreate baseContract={baseContract} />}
      {method === 'non-fungibleTokenCreate' && <NonFungibleTokenCreate baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenCreateMethods;
