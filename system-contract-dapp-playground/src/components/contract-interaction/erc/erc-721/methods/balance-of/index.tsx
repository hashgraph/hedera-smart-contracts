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
import { Contract, isAddress } from 'ethers';
import { ReactNode, useCallback, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { erc721BalanceOf } from '@/api/hedera/erc721-interactions';
import HederaCommonTextField from '@/components/common/components/HederaCommonTextField';
import { Table, TableContainer, Tbody, Th, Thead, Tr, useToast } from '@chakra-ui/react';
import useUpdateMapStateUILocalStorage from '../../../../../../hooks/useUpdateMapStateUILocalStorage';
import useRetrieveMapValueFromLocalStorage from '../../../../../../hooks/useRetrieveMapValueFromLocalStorage';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const ERC721BalanceOf = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountAddress, setAccountAddress] = useState('');
  const [reactNodes, setReactNodes] = useState<ReactNode[]>([]);
  const [balancesMap, setBalancesMap] = useState(new Map<string, number>());
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC721-RESULT']['BALANCE-OF'];

  /** @dev retrieve values from localStorage to maintain data on re-renders */
  useRetrieveMapValueFromLocalStorage(toaster, transactionResultStorageKey, setBalancesMap);

  /** @dev handle executing balance of */
  /** @notice wrapping handleExecuteBalanceOf in useCallback hook to prevent excessive re-renders */
  const handleExecuteBalanceOf = useCallback(
    async (accountAddress: string, refreshMode?: boolean) => {
      // sanitize params
      if (!refreshMode && !isAddress(accountAddress)) {
        CommonErrorToast({
          toaster,
          title: 'Invalid parameters',
          description: 'Account address is not a valid address',
        });
        return;
      }
      // turn isLoading on
      if (!refreshMode) setIsLoading(true);

      const { balanceOfRes, err: balanceOfErr } = await erc721BalanceOf(baseContract, accountAddress);

      // turn isLoading off
      if (!refreshMode) setIsLoading(false);

      if (balanceOfErr || !balanceOfRes) {
        CommonErrorToast({
          toaster,
          title: 'Invalid parameters',
          description: 'Account address is not a valid address',
        });
        return;
      }

      // udpate balances
      setBalancesMap((prev) => new Map(prev).set(accountAddress, Number(balanceOfRes)));
      if (!refreshMode) setAccountAddress('');
    },
    [baseContract, toaster]
  );

  // @dev listen to change event on balancesMap state => update UI & localStorage
  useUpdateMapStateUILocalStorage({
    toaster,
    baseContract,
    setReactNodes,
    mapType: 'BALANCES',
    mapValues: balancesMap,
    transactionResultStorageKey,
    setMapValues: setBalancesMap,
    handleExecuteMethodAPI: handleExecuteBalanceOf,
  });

  return (
    <div className=" flex flex-col items-start gap-12">
      {/* wrapper */}
      <div className="flex gap-12 items-center w-[580px]">
        {/* method */}
        <HederaCommonTextField
          type={'text'}
          title={'Balance of'}
          value={accountAddress}
          setValue={setAccountAddress}
          placeholder={'Account address...'}
          size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          explanation={'Returns the amount of tokens owned by account.'}
        />

        {/* execute button */}
        <button
          onClick={() => handleExecuteBalanceOf(accountAddress)}
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

      <div className="flex flex-col gap-6 text-base">
        {/* display balances */}
        {balancesMap.size > 0 && (
          <TableContainer>
            <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
              <Thead>
                <Tr>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>Account</Th>
                  <Th color={HEDERA_BRANDING_COLORS.violet} isNumeric>
                    Balance
                  </Th>
                  <Th />
                  <Th />
                </Tr>
              </Thead>
              <Tbody>{reactNodes}</Tbody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
};

export default ERC721BalanceOf;
