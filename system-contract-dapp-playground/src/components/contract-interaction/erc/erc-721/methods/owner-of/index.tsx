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

import Image from 'next/image';
import { Contract } from 'ethers';
import { ReactNode, useCallback, useState } from 'react';
import { erc721OwnerOf } from '@/api/hedera/erc721-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import HederaCommonTextField from '@/components/common/components/HederaCommonTextField';
import { Table, TableContainer, Tbody, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import useUpdateMapStateUILocalStorage from '../../../../../../hooks/useUpdateMapStateUILocalStorage';
import useRetrieveMapValueFromLocalStorage from '../../../../../../hooks/useRetrieveMapValueFromLocalStorage';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_WALLET_REVERT_REASONS,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const ERC721OwnerOf = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [tokenId, setTokenId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ractNodes, setReactNodes] = useState<ReactNode[]>([]);
  const [tokenOwners, setTokenOwners] = useState(new Map<number, string>());
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['OWNER-OF'];

  /** @dev retrieve values from localStorage to maintain data on re-renders */
  useRetrieveMapValueFromLocalStorage(toaster, transactionResultStorageKey, setTokenOwners);

  /** @dev handle executing erc721OwnerOf */
  /** @notice wrapping handleExecuteOwnerOf in useCallback hook to prevent excessive re-renders */
  const handleExecuteOwnerOf = useCallback(
    async (tokenIdValue: number, refreshMode?: boolean) => {
      /// sanitize params
      if (!refreshMode && tokenIdValue < 0) {
        CommonErrorToast({
          toaster,
          title: 'Invalid parameters',
          description: 'TokenID cannot be negative',
        });
        return;
      }

      // turn isLoading on
      if (!refreshMode) setIsLoading(true);

      // invoke erc721OwnerOf()
      const { ownerOfRes, err } = await erc721OwnerOf(baseContract, tokenIdValue);

      // turn isLoading off
      if (!refreshMode) setIsLoading(false);

      if (err) {
        CommonErrorToast({
          toaster,
          title: 'Transaction got reverted',
          description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
        });
        return;
      }

      // udpate tokenOwners
      setTokenOwners((prev) => new Map(prev).set(tokenIdValue, ownerOfRes || ''));
      if (!refreshMode) setTokenId('');
    },
    [toaster, baseContract]
  );

  // @dev listen to change event on tokenURIMap state => update UI & localStorage
  useUpdateMapStateUILocalStorage({
    toaster,
    baseContract,
    setReactNodes,
    mapValues: tokenOwners,
    mapType: 'TOKEN_OWNERS',
    transactionResultStorageKey,
    setMapValues: setTokenOwners,
    handleExecuteMethodAPI: handleExecuteOwnerOf,
  });

  return (
    <div className="flex flex-col items-start gap-12">
      {/* wrapper */}
      <div className="flex gap-12 items-center w-[580px]">
        {/* method */}
        <HederaCommonTextField
          type={'text'}
          value={tokenId}
          title={'Token ID'}
          setValue={setTokenId}
          placeholder={'Token ID...'}
          size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          explanation={'Returns the token URI of the token.'}
        />

        {/* execute button */}
        <button
          onClick={() => handleExecuteOwnerOf(Number(tokenId))}
          disabled={isLoading}
          className={`border mt-3 w-48 py-2 rounded-xl transition duration-300 ${
            isLoading
              ? 'cursor-not-allowed border-white/30 text-white/30'
              : 'border-button-stroke-violet text-button-stroke-violet hover:bg-button-stroke-violet/60 hover:text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex gap-1 justify-center">
              Executing...
              <Image
                src={'/brandings/hedera-logomark.svg'}
                alt={'hedera-logomark'}
                width={15}
                height={15}
                className="animate-bounce"
              />
            </div>
          ) : (
            <>Execute</>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-6 text-base w-full">
        {/* display balances */}
        {tokenOwners.size > 0 && (
          <TableContainer>
            <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
              <Thead>
                <Tr>
                  <Th color={HEDERA_BRANDING_COLORS.violet} isNumeric>
                    Token ID
                  </Th>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>Token URI</Th>
                  <Th />
                  <Th />
                </Tr>
              </Thead>
              <Tbody className="w-full">{ractNodes}</Tbody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
};

export default ERC721OwnerOf;
