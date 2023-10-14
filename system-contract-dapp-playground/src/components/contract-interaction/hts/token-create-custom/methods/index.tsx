/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { Contract } from 'ethers';
import FungibleTokenCreate from './FungibleTokenCreate';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const HederaTokenCreateMethods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'mint' && <>Mint</>}
      {method === 'grantKYC' && <>KYC</>}
      {method === 'tokenAssociation' && <>Association</>}
      {method === 'non-fungibleTokenCreate' && <>non-fungible</>}
      {method === 'fungibleTokenCreate' && <FungibleTokenCreate baseContract={baseContract} />}
    </>
  );
};

export default HederaTokenCreateMethods;
