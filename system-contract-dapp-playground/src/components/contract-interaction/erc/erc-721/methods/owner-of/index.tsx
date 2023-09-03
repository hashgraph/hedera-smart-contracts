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
import { BiCopy } from 'react-icons/bi';
import { AiOutlineMinus } from 'react-icons/ai';
import { IoRefreshOutline } from 'react-icons/io5';
import { ReactNode, useEffect, useState } from 'react';
import { erc721OwnerOf } from '@/api/hedera/erc721-interactions';
import { getBalancesFromLocalStorage } from '@/api/localStorage';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import HederaCommonTextField from '@/components/common/HederaCommonTextField';
import { copyWalletAddress, handleRemoveRecord } from '../../../shared/methods';
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

const ERC721OwnerOf = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [tokenId, setTokenId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ractNodes, setReactNodes] = useState<ReactNode[]>([]);
  const [tokenOwners, setTokenOwners] = useState(new Map<number, string>());
  const transactionResultStorageKey = 'HEDERA.EIP.ERC-721.OWNER-OF.READONLY';

  /** @dev retrieve balances from localStorage to maintain data on re-renders */
  useEffect(() => {
    const { storageBalances, err: localStorageBalanceErr } = getBalancesFromLocalStorage(
      transactionResultStorageKey
    );
    // handle err
    if (localStorageBalanceErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve balances from local storage',
        description: "See client's console for more information",
      });
      return;
    }

    // update setTokenOwners
    if (storageBalances) {
      setTokenOwners(storageBalances);
    }
  }, [toaster]);

  /** @dev handle executing erc721OwnerOf */
  const handleExecuteOwnerOf = async () => {
    // sanitize params
    if (Number(tokenId) < 0) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: 'TokenID cannot be negative',
      });
      return;
    }

    setIsLoading(true);

    // invoke erc721OwnerOf()
    const { ownerOfRes, err } = await erc721OwnerOf(baseContract, Number(tokenId));

    setIsLoading(false);

    if (err) {
      CommonErrorToast({
        toaster,
        title: 'Transaction got reverted',
        description: "See client's console for more information",
      });
      return;
    }

    // udpate tokenOwners
    setTokenOwners((prev) => new Map(prev).set(Number(tokenId), ownerOfRes || ''));
    setTokenId('');
  };

  // @dev listen to change event on tokenOwners state => update UI & localStorage
  useEffect(() => {
    //// update UI
    let reactNodes = [] as ReactNode[];
    tokenOwners.forEach((itTokenOwner, itTokenID) => {
      /** @dev handle refresh record */
      const handleRefreshRecord = async (currentTokenId: number) => {
        // invoke erc721OwnerOf()
        const { ownerOfRes, err } = await erc721OwnerOf(baseContract, Number(currentTokenId));
        if (err) {
          CommonErrorToast({
            toaster,
            title: 'Transaction got reverted',
            description: "See client's console for more information",
          });
          return;
        }

        // udpate erc721OwnerOf
        setTokenOwners((prev) => new Map(prev).set(currentTokenId, ownerOfRes || ''));
      };

      reactNodes.push(
        <Tr key={itTokenID} className="w-full">
          {/* tokenID */}
          <Td isNumeric>
            <p className="text-start">{itTokenID}</p>
          </Td>
          <Td
            onClick={() => {
              itTokenOwner !== '' && copyWalletAddress(itTokenOwner);
            }}
            className="cursor-pointer w-full max-w-[100px]"
          >
            {/* tokenOwner */}
            <Popover>
              <PopoverTrigger>
                <div className="flex gap-1 items-center">
                  <p className="overflow-hidden text-ellipsis">
                    {itTokenOwner || 'Token URI is empty'}
                  </p>
                  {itTokenOwner !== '' && (
                    <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                      <BiCopy />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent width={'fit-content'} border={'none'}>
                {itTokenOwner !== '' && (
                  <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                )}
              </PopoverContent>
            </Popover>
          </Td>
          <Td>
            {/* refresh button */}
            <Tooltip label="refresh this record" placement="top">
              <button
                onClick={() => {
                  handleRefreshRecord(itTokenID);
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
                  handleRemoveRecord(itTokenID, setTokenOwners, transactionResultStorageKey);
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
    setReactNodes(reactNodes);

    //// update local storage
    if (tokenOwners.size > 0) {
      localStorage.setItem(
        transactionResultStorageKey,
        JSON.stringify(Object.fromEntries(tokenOwners))
      );
    }
  }, [tokenOwners, baseContract, toaster]);

  return (
    <div className="flex flex-col items-start gap-12">
      {/* wrapper */}
      <div className="flex gap-12 items-center w-[580px]">
        {/* method */}
        <HederaCommonTextField
          size={'md'}
          value={tokenId}
          title={'Token ID'}
          explanation={'Returns the token URI of the token.'}
          placeholder={'Token ID...'}
          type={'text'}
          setValue={setTokenId}
        />

        {/* execute button */}
        <button
          onClick={handleExecuteOwnerOf}
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
            <Table variant="simple" size={'sm'}>
              <Thead>
                <Tr>
                  <Th color={'#82ACF9'} isNumeric>
                    Token ID
                  </Th>
                  <Th color={'#82ACF9'}>Token URI</Th>
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
