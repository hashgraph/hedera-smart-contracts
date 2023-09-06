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
import { BiCopy } from 'react-icons/bi';
import { Contract, isAddress } from 'ethers';
import { AiOutlineMinus } from 'react-icons/ai';
import { IoRefreshOutline } from 'react-icons/io5';
import { ReactNode, useEffect, useState } from 'react';
import { balanceOf } from '@/api/hedera/erc20-interactions';
import { getBalancesFromLocalStorage } from '@/api/localStorage';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { HEDERA_BRANDING_COLORS } from '@/utils/common/constants';
import HederaCommonTextField from '@/components/common/HederaCommonTextField';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast,
} from '@chakra-ui/react';

interface PageProps {
  baseContract: Contract;
}

const BalanceOf = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accountAddress, setAccountAddress] = useState('');
  const [balancesMap, setBalancesMap] = useState(new Map<string, number>());
  const [balancesRactNodes, setBalancesReactNodes] = useState<ReactNode[]>([]);

  /** @dev retrieve balances from localStorage to maintain data on re-renders */
  useEffect(() => {
    const { storageBalances, err: localStorageBalanceErr } = getBalancesFromLocalStorage();
    // handle err
    if (localStorageBalanceErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve balances from local storage',
        description: "See client's console for more information",
      });
      return;
    }

    // update balancesMap
    if (storageBalances) {
      setBalancesMap(storageBalances);
    }
  }, [toaster]);

  /** @dev copy content to clipboard */
  const copyWalletAddress = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  /** @dev handle remove record */
  const handleRemoveRecord = (addr: string) => {
    setBalancesMap((prev) => {
      prev.delete(addr);
      if (prev.size === 0) {
        localStorage.removeItem('hedera_erc20_balances');
      }
      return new Map(prev);
    });
  };

  /** @dev handle executing balance of */
  const handleExecuteBalanceOf = async () => {
    // sanitize params
    if (!isAddress(accountAddress)) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: 'Account address is not a valid address',
      });
      return;
    }

    // invoke balanceOf()
    setIsLoading(true);
    const { balanceOfRes, err: balanceOfErr } = await balanceOf(baseContract, accountAddress);
    setIsLoading(false);
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
    setAccountAddress('');
  };

  // @dev listen to change event on balancesMap state => update UI & localStorage
  useEffect(() => {
    //// update UI
    let reactNodes = [] as ReactNode[];
    balancesMap.forEach((amount, account) => {
      /** @dev handle refresh record */
      const handleRefreshRecord = async (addr: string) => {
        // invoke balanceOf()
        const { balanceOfRes, err: balanceOfErr } = await balanceOf(baseContract, account);
        if (balanceOfErr || !balanceOfRes) {
          CommonErrorToast({
            toaster,
            title: 'Invalid parameters',
            description: 'Account address is not a valid address',
          });
          return;
        }

        // udpate balances
        setBalancesMap((prev) => new Map(prev).set(account, Number(balanceOfRes)));
      };

      reactNodes.push(
        <Tr key={account}>
          <Td onClick={() => copyWalletAddress(account)} className="cursor-pointer">
            {/* account field */}
            <Popover>
              <PopoverTrigger>
                <div className="flex gap-1 items-center">
                  <p>{account}</p>
                  <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                    <BiCopy />
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent width={'fit-content'} border={'none'}>
                <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
              </PopoverContent>
            </Popover>
          </Td>
          <Td isNumeric>
            <p>{amount}</p>
          </Td>
          <Td>
            {/* refresh button */}
            <Tooltip label="refresh this record" placement="top">
              <button
                onClick={() => {
                  handleRefreshRecord(account);
                }}
                className={`border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-teal-500 transition duration-300`}
              >
                <IoRefreshOutline />
              </button>
            </Tooltip>
          </Td>
          <Td>
            {/* delete button */}
            <Tooltip label="delete this record" placement="top">
              <button
                onClick={() => {
                  handleRemoveRecord(account);
                }}
                className={`border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
              >
                <AiOutlineMinus />
              </button>
            </Tooltip>
          </Td>
        </Tr>
      );
    });
    setBalancesReactNodes(reactNodes);

    //// update local storage
    if (balancesMap.size > 0) {
      localStorage.setItem(
        'hedera_erc20_balances',
        JSON.stringify(Object.fromEntries(balancesMap))
      );
    }
  }, [balancesMap, baseContract, toaster]);

  return (
    <div className=" flex flex-col items-start gap-12">
      {/* wrapper */}
      <div className="flex gap-12 items-center w-[580px]">
        {/* method */}
        <HederaCommonTextField
          size={'md'}
          value={accountAddress}
          title={'Balance of'}
          explanation={'Returns the amount of tokens owned by account.'}
          placeholder={'Account address...'}
          type={'text'}
          setValue={setAccountAddress}
        />

        {/* execute button */}
        <button
          onClick={handleExecuteBalanceOf}
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
            <Table variant="simple" size={'sm'}>
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
              <Tbody>{balancesRactNodes}</Tbody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
};

export default BalanceOf;
