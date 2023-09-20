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

import Mint from './mint';
import { Contract } from 'ethers';
import ERC721Approve from './approve';
import ERC721OwnerOf from './owner-of';
import ERC721TokenURI from './token-uri';
import ERC721BalanceOf from './balance-of';
import ERC721Transfer from './token-transfer';
import TokenInformation from './token-information';
import ERC721OperatorApproval from './operator-approve';

interface PageProps {
  method: string;
  baseContract: Contract;
}

const ERC721Methods = ({ baseContract, method }: PageProps) => {
  return (
    <>
      {method === 'mint' && <Mint baseContract={baseContract} />}
      {method === 'owner' && <ERC721OwnerOf baseContract={baseContract} />}
      {method === 'approve' && <ERC721Approve baseContract={baseContract} />}
      {method === 'tokenURI' && <ERC721TokenURI baseContract={baseContract} />}
      {method === 'balance' && <ERC721BalanceOf baseContract={baseContract} />}
      {method === 'transferFrom' && <ERC721Transfer baseContract={baseContract} />}
      {method === 'tokenInformation' && <TokenInformation baseContract={baseContract} />}
      {method === 'operatorApproval' && <ERC721OperatorApproval baseContract={baseContract} />}
    </>
  );
};

export default ERC721Methods;
