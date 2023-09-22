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
import { BiCopy } from 'react-icons/bi';
import { useEffect, ReactNode } from 'react';
import { AiOutlineMinus } from 'react-icons/ai';
import { IoRefreshOutline } from 'react-icons/io5';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { erc721TokenApprove } from '@/api/hedera/erc721-interactions';
import { HEDERA_COMMON_WALLET_REVERT_REASONS } from '@/utils/common/constants';
import { copyContentToClipboard, handleRemoveRecord } from '../components/common/methods/common';
import { Tr, Td, Popover, PopoverTrigger, PopoverContent, Tooltip } from '@chakra-ui/react';

interface PageProps {
  toaster: any;
  mapValues: any;
  setMapValues: any;
  setReactNodes: any;
  baseContract: Contract;
  handleExecuteMethodAPI: any;
  transactionResultStorageKey: string;
  mapType: 'BALANCES' | 'TOKEN_URI' | 'TOKEN_OWNERS' | 'GET_APPROVE';
}

const useUpdateMapStateUILocalStorage = ({
  toaster,
  mapType,
  mapValues,
  setMapValues,
  baseContract,
  setReactNodes,
  handleExecuteMethodAPI,
  transactionResultStorageKey,
}: PageProps) => {
  useEffect(() => {
    //// update UI
    let UIreactNodes = [] as ReactNode[];

    switch (mapType) {
      case 'TOKEN_URI':
        mapValues.forEach((itTokenURI: any, itTokenID: any) => {
          UIreactNodes.push(
            <Tr key={itTokenID} className="w-full">
              {/* tokenID */}
              <Td isNumeric>
                <p className="text-start">{itTokenID}</p>
              </Td>
              <Td
                onClick={() => {
                  itTokenURI !== '' && copyContentToClipboard(itTokenURI);
                }}
                className="cursor-pointer w-full max-w-[100px]"
              >
                {/* tokenURI */}
                <Popover>
                  <PopoverTrigger>
                    <div className="flex gap-1 items-center">
                      <p className="overflow-hidden text-ellipsis">{itTokenURI || 'Token URI is empty'}</p>
                      {itTokenURI !== '' && (
                        <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                          <BiCopy />
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent width={'fit-content'} border={'none'}>
                    {itTokenURI !== '' && (
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
                      handleExecuteMethodAPI(itTokenID, true);
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
                      handleRemoveRecord(itTokenID, setMapValues, transactionResultStorageKey);
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
        break;

      case 'BALANCES':
        mapValues.forEach((amount: any, account: any) => {
          UIreactNodes.push(
            <Tr key={account}>
              <Td onClick={() => copyContentToClipboard(account)} className="cursor-pointer">
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
                    onClick={() => handleExecuteMethodAPI(account, true)}
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
                      handleRemoveRecord(account, setMapValues, transactionResultStorageKey);
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
        break;

      case 'TOKEN_OWNERS':
        mapValues.forEach((itTokenOwner: any, itTokenID: any) => {
          UIreactNodes.push(
            <Tr key={itTokenID} className="w-full">
              {/* tokenID */}
              <Td isNumeric>
                <p className="text-start">{itTokenID}</p>
              </Td>
              <Td
                onClick={() => {
                  itTokenOwner !== '' && copyContentToClipboard(itTokenOwner);
                }}
                className="cursor-pointer w-full max-w-[100px]"
              >
                {/* tokenOwner */}
                <Popover>
                  <PopoverTrigger>
                    <div className="flex gap-1 items-center">
                      <p className="overflow-hidden text-ellipsis">{itTokenOwner || 'Token URI is empty'}</p>
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
                      handleExecuteMethodAPI(itTokenID, true);
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
                      handleRemoveRecord(itTokenID, setMapValues, transactionResultStorageKey);
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
        break;

      case 'GET_APPROVE':
        mapValues.forEach((itTokenOwner: any, itTokenID: any) => {
          /** @dev handle refresh record */
          const handleRefreshRecord = async (currentTokenId: number) => {
            // invoke erc721OwnerOf()
            const { approvedAccountRes, err } = await erc721TokenApprove(
              baseContract,
              'GET_APPROVE',
              itTokenOwner,
              currentTokenId
            );
            if (err) {
              CommonErrorToast({
                toaster,
                title: 'Transaction got reverted',
                description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
              });
              return;
            }

            // udpate erc721OwnerOf
            setMapValues((prev: any) => new Map(prev).set(currentTokenId, approvedAccountRes || ''));
          };

          UIreactNodes.push(
            <Tr key={itTokenID} className="w-full">
              {/* tokenID */}
              <Td isNumeric>
                <p className="text-start">{itTokenID}</p>
              </Td>
              <Td
                onClick={() => {
                  itTokenOwner !== '' && copyContentToClipboard(itTokenOwner);
                }}
                className="cursor-pointer w-full"
              >
                {/* tokenOwner */}
                <Popover>
                  <PopoverTrigger>
                    <div className="flex gap-1 items-center">
                      <p className="overflow-hidden text-ellipsis">
                        {itTokenOwner || 'Token owner is not found'}
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
                      handleRemoveRecord(itTokenID, setMapValues, transactionResultStorageKey);
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
        break;
    }

    setReactNodes(UIreactNodes);

    //// update local storage
    if (mapValues.size > 0) {
      localStorage.setItem(transactionResultStorageKey, JSON.stringify(Object.fromEntries(mapValues)));
    }
  }, [
    toaster,
    mapType,
    mapValues,
    baseContract,
    setMapValues,
    setReactNodes,
    handleExecuteMethodAPI,
    transactionResultStorageKey,
  ]);
};

export default useUpdateMapStateUILocalStorage;
