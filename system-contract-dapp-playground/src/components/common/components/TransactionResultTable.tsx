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

import Link from 'next/link';
import { ethers } from 'ethers';
import { FiExternalLink } from 'react-icons/fi';
import { AiOutlineMinus } from 'react-icons/ai';
import { Dispatch, SetStateAction } from 'react';
import { IoRefreshOutline } from 'react-icons/io5';
import PageinationButtons from './PageinationButtons';
import { copyContentToClipboard } from '../methods/common';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
} from '@/utils/common/constants';
import {
  Tr,
  Th,
  Td,
  Table,
  Thead,
  Tbody,
  Popover,
  Tooltip,
  TableContainer,
  PopoverTrigger,
  PopoverContent,
} from '@chakra-ui/react';

/** @dev shared component representing the list of transactions */
interface TransactionResultTablePageProps {
  onOpen?: () => void;
  hederaNetwork: string;
  TRANSACTION_PAGE_SIZE: number;
  currentTransactionPage: number;
  handleReexecuteMethodAPI?: any;
  transactionResultStorageKey: string;
  transactionResults: ITransactionResult[];
  setTokenInfoFromTxResult?: Dispatch<any>;
  paginatedTransactionResults: ITransactionResult[];
  setShowTokenInfo?: Dispatch<SetStateAction<boolean>>;
  setAPIMethodsFromTxResult?: Dispatch<SetStateAction<any>>;
  setCurrentTransactionPage: Dispatch<SetStateAction<number>>;
  setTokenAddressFromTxResult?: Dispatch<SetStateAction<string>>;
  setTransactionResults: Dispatch<SetStateAction<ITransactionResult[]>>;
  setKeyTypeFromTxResult?: Dispatch<SetStateAction<IHederaTokenServiceKeyType>>;
  API:
    | 'PRNG'
    | 'ERC20Mint'
    | 'GrantKYC'
    | 'TokenMint'
    | 'ERC721Mint'
    | 'TokenCreate'
    | 'ExchangeRate'
    | 'ERCBalanceOf'
    | 'ERC721OwnerOf'
    | 'QueryValidity'
    | 'ERC20Transfer'
    | 'ERC721Transfer'
    | 'ERC721Approves'
    | 'CryptoTransfer'
    | 'ERC721TokenURI'
    | 'TokenAssociate'
    | 'ERC721Approval'
    | 'TransferSingle'
    | 'QueryTokenStatus'
    | 'QuerySpecificInfo'
    | 'ERCTokenPermission'
    | 'QueryTokenPermission'
    | 'QueryTokenGeneralInfo';
}

export const TransactionResultTable = ({
  API,
  onOpen,
  hederaNetwork,
  setShowTokenInfo,
  transactionResults,
  setTransactionResults,
  TRANSACTION_PAGE_SIZE,
  currentTransactionPage,
  setKeyTypeFromTxResult,
  setTokenInfoFromTxResult,
  handleReexecuteMethodAPI,
  setAPIMethodsFromTxResult,
  setCurrentTransactionPage,
  setTokenAddressFromTxResult,
  transactionResultStorageKey,
  paginatedTransactionResults,
}: TransactionResultTablePageProps) => {
  let beginingHashIndex: number, endingHashIndex: number;
  switch (API) {
    case 'PRNG':
    case 'TokenCreate':
    case 'ERCBalanceOf':
      beginingHashIndex = 15;
      endingHashIndex = -12;
      break;
    case 'GrantKYC':
    case 'QueryValidity':
    case 'ERC721OwnerOf':
    case 'TokenAssociate':
      beginingHashIndex = 10;
      endingHashIndex = -5;
      break;
    case 'ERC20Mint':
    case 'TokenMint':
    case 'ERC721Mint':
    case 'QuerySpecificInfo':
    case 'QueryTokenPermission':
    case 'QueryTokenGeneralInfo':
      beginingHashIndex = 8;
      endingHashIndex = -4;
      break;
    case 'ExchangeRate':
    case 'ERC20Transfer':
    case 'ERC721Transfer':
    case 'TransferSingle':
    case 'ERC721Approves':
    case 'ERC721Approval':
    case 'QueryTokenStatus':
    case 'ERCTokenPermission':
      beginingHashIndex = 4;
      endingHashIndex = -3;
      break;
  }

  return (
    <TableContainer className="flex flex-col gap-3 overflow-x-hidden">
      <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
        <Thead>
          <Tr>
            <Th color={HEDERA_BRANDING_COLORS.violet} isNumeric className="flex justify-start">
              Index
            </Th>
            {API !== 'ERCTokenPermission' && API !== 'ERC721Approval' && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>Status</Th>
            )}
            {API !== 'ERCBalanceOf' && API !== 'ERC721TokenURI' && API !== 'ERC721OwnerOf' && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>Tx hash</Th>
            )}
            {API !== 'PRNG' &&
              API !== 'ERC20Mint' &&
              API !== 'ERC721Mint' &&
              API !== 'ERCBalanceOf' &&
              API !== 'ExchangeRate' &&
              API !== 'ERC721OwnerOf' &&
              API !== 'ERC20Transfer' &&
              API !== 'ERC721Transfer' &&
              API !== 'ERC721TokenURI' &&
              API !== 'CryptoTransfer' &&
              API !== 'ERC721Approves' &&
              API !== 'ERC721Approval' &&
              API !== 'ERCTokenPermission' && (
                <Th color={HEDERA_BRANDING_COLORS.violet}>{`Token ${
                  API !== 'TransferSingle' ? `Address` : ``
                }`}</Th>
              )}
            {(API === 'TransferSingle' || API === 'ERC721Transfer') && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>Sender</Th>
            )}
            {(API === 'ERC721OwnerOf' || API === 'ERC721Approves') && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>TokenID</Th>
            )}
            {(API === 'ERCTokenPermission' ||
              API === 'ERC20Transfer' ||
              API === 'ERC721OwnerOf' ||
              API === 'ERC721Approval') && <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>}
            {API === 'ERC721Approval' && <Th color={HEDERA_BRANDING_COLORS.violet}>Operator</Th>}
            {(API === 'TokenMint' ||
              API === 'ERC20Mint' ||
              API === 'ERC721Mint' ||
              API === 'ERC20Transfer' ||
              API === 'ERC721Transfer' ||
              API === 'TransferSingle') && <Th color={HEDERA_BRANDING_COLORS.violet}>Recipient</Th>}
            {(API === 'ERCTokenPermission' || API === 'ERC721Approves') && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>Spender</Th>
            )}
            {API === 'TokenAssociate' && <Th color={HEDERA_BRANDING_COLORS.violet}>Associated Account</Th>}
            {API === 'QueryTokenStatus' ||
              (API === 'ERCBalanceOf' && <Th color={HEDERA_BRANDING_COLORS.violet}>Account</Th>)}
            {API === 'ERCBalanceOf' && <Th color={HEDERA_BRANDING_COLORS.violet}> Balance</Th>}
            {API === 'GrantKYC' && <Th color={HEDERA_BRANDING_COLORS.violet}>KYCed Account</Th>}
            {API === 'QueryValidity' && <Th color={HEDERA_BRANDING_COLORS.violet}>Valid Token</Th>}
            {API === 'ERC721Approval' && <Th color={HEDERA_BRANDING_COLORS.violet}>Status</Th>}
            {API === 'QueryTokenStatus' && <Th color={HEDERA_BRANDING_COLORS.violet}>Relation</Th>}
            {(API === 'QueryTokenGeneralInfo' ||
              API === 'QuerySpecificInfo' ||
              API === 'QueryTokenPermission') && <Th color={HEDERA_BRANDING_COLORS.violet}>Token Info</Th>}
            {API === 'PRNG' && <Th color={HEDERA_BRANDING_COLORS.violet}>Seed</Th>}
            {API === 'ExchangeRate' && <Th color={HEDERA_BRANDING_COLORS.violet}>Initial Amount</Th>}
            {API === 'ExchangeRate' && <Th color={HEDERA_BRANDING_COLORS.violet}>Converted Amount</Th>}
            {(API === 'ERCTokenPermission' || API === 'ERC20Mint' || API === 'ERC20Transfer') && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>Amount</Th>
            )}
            {(API === 'ERC721Mint' || API === 'ERC721TokenURI' || API === 'ERC721Transfer') && (
              <Th color={HEDERA_BRANDING_COLORS.violet}>TokenID</Th>
            )}
            {API === 'ERC721TokenURI' && <Th color={HEDERA_BRANDING_COLORS.violet}>Token URI</Th>}
            {(API === 'ExchangeRate' ||
              API === 'TransferSingle' ||
              API === 'ERC721Approves' ||
              API === 'ERC721Approval' ||
              API === 'QueryTokenStatus' ||
              API === 'QuerySpecificInfo' ||
              API === 'ERCTokenPermission' ||
              API === 'QueryTokenPermission' ||
              API === 'QueryTokenGeneralInfo') && <Th color={HEDERA_BRANDING_COLORS.violet}>API called</Th>}
            {/* refresh button */}
            {(API === 'ERCBalanceOf' ||
              API === 'ERC721OwnerOf' ||
              API === 'ERC721Approves' ||
              API === 'ERC721TokenURI' ||
              API === 'ERC721Approval' ||
              API === 'ERCTokenPermission') && <Th />}
            {/* delete record button */}
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {paginatedTransactionResults.map((transactionResult, index) => {
            /** @dev handle removing record */
            const handleRemoveRecord = (targetTransactionResult: ITransactionResult) => {
              const filteredItems = transactionResults.filter(
                (transactionResult) => targetTransactionResult.txHash !== transactionResult.txHash
              );
              if (filteredItems.length === 0) {
                localStorage.removeItem(transactionResultStorageKey);
              }
              setTransactionResults(filteredItems);
            };

            return (
              <Tr
                key={transactionResult.txHash}
                className={
                  transactionResult.status === 'success' ? 'hover:bg-hedera-green/10' : 'hover:bg-red-400/10'
                }
              >
                {/* index */}
                <Td>
                  <p>{index + (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE + 1}</p>
                </Td>

                {/* status */}
                {API !== 'ERCTokenPermission' && API !== 'ERC721Approval' && (
                  <Td>
                    <p
                      className={
                        transactionResult.status === 'success' ? `text-hedera-green` : `text-red-400`
                      }
                    >
                      {transactionResult.status.toUpperCase()}
                    </p>
                  </Td>
                )}

                {/* transaction hash */}
                {API !== 'ERCBalanceOf' && API !== 'ERC721TokenURI' && API !== 'ERC721OwnerOf' && (
                  <Td className="cursor-pointer">
                    {transactionResult.readonly ? (
                      <p>N/A</p>
                    ) : (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.txHash)}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy transaction hash">
                                  {API === 'CryptoTransfer' ? (
                                    transactionResult.txHash
                                  ) : (
                                    <p>
                                      {transactionResult.txHash.slice(0, beginingHashIndex)}...
                                      {transactionResult.txHash.slice(endingHashIndex)}
                                    </p>
                                  )}
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Tooltip
                          label={'Explore this transaction on HashScan'}
                          placement="top"
                          fontWeight={'medium'}
                        >
                          <Link
                            href={`https://hashscan.io/${hederaNetwork}/transaction/${transactionResult.txHash}`}
                            target="_blank"
                          >
                            <FiExternalLink />
                          </Link>
                        </Tooltip>
                      </div>
                    )}
                  </Td>
                )}

                {/* token address */}
                {(API === 'TokenCreate' ||
                  API === 'TokenMint' ||
                  API === 'GrantKYC' ||
                  API === 'QueryValidity' ||
                  API === 'QueryTokenGeneralInfo' ||
                  API === 'QuerySpecificInfo' ||
                  API === 'QueryTokenPermission' ||
                  API === 'QueryTokenStatus' ||
                  API === 'TransferSingle') && (
                  <Td className="cursor-pointer">
                    {transactionResult.tokenAddress ? (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.tokenAddress!)}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy token address">
                                  <p>
                                    {transactionResult.tokenAddress.slice(0, beginingHashIndex)}...
                                    {transactionResult.tokenAddress.slice(endingHashIndex)}
                                  </p>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Tooltip
                          label={'Explore this token on HashScan'}
                          placement="top"
                          fontWeight={'medium'}
                        >
                          <Link
                            href={`https://hashscan.io/${hederaNetwork}/token/${transactionResult.tokenAddress}`}
                            target="_blank"
                          >
                            <FiExternalLink />
                          </Link>
                        </Tooltip>
                      </div>
                    ) : (
                      <>
                        {`${ethers.ZeroAddress.slice(0, beginingHashIndex)}...${ethers.ZeroAddress.slice(
                          endingHashIndex
                        )}`}
                      </>
                    )}
                  </Td>
                )}

                {/* associated token address */}
                {API === 'TokenAssociate' && (
                  <Td className="cursor-pointer">
                    {transactionResult.tokenAddresses && transactionResult.tokenAddresses.length === 1 ? (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.tokenAddresses![0])}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy token address">
                                  <p>
                                    {transactionResult.tokenAddresses[0].slice(0, beginingHashIndex)}
                                    ...
                                    {transactionResult.tokenAddresses[0].slice(endingHashIndex)}
                                  </p>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Tooltip
                          label={'Explore this token on HashScan'}
                          placement="top"
                          fontWeight={'medium'}
                        >
                          <Link
                            href={`https://hashscan.io/${hederaNetwork}/token/${transactionResult.tokenAddresses[0]}`}
                            target="_blank"
                          >
                            <FiExternalLink />
                          </Link>
                        </Tooltip>
                      </div>
                    ) : (
                      <div>
                        <Popover>
                          <PopoverTrigger>
                            <div className="flex gap-1 items-center">
                              <Tooltip label="click to show token addresses">
                                <p>Token Combination</p>
                              </Tooltip>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent
                            width={'fit-content'}
                            border={'none'}
                            className="flex flex-col gap-6 bg-secondary px-4 py-3"
                          >
                            {transactionResult.tokenAddresses?.map((token) => (
                              <div key={token} className="bg-secondary border-none font-medium flex gap-1">
                                <div onClick={() => copyContentToClipboard(token)}>
                                  <Popover>
                                    <PopoverTrigger>
                                      <div className="flex gap-1 items-center">
                                        <Tooltip label="click to copy token address">
                                          <p>
                                            {token.slice(0, beginingHashIndex)}
                                            ...
                                            {token.slice(endingHashIndex)}
                                          </p>
                                        </Tooltip>
                                      </div>
                                    </PopoverTrigger>
                                    <PopoverContent width={'fit-content'} border={'none'}>
                                      <div className="bg-secondary px-3 py-2 border-none font-medium">
                                        Copied
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <Tooltip
                                  label={'Explore this token on HashScan'}
                                  placement="top"
                                  fontWeight={'medium'}
                                >
                                  <Link
                                    href={`https://hashscan.io/${hederaNetwork}/token/${token}`}
                                    target="_blank"
                                  >
                                    <FiExternalLink />
                                  </Link>
                                </Tooltip>
                              </div>
                            ))}
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </Td>
                )}

                {/* Account address*/}
                {(API === 'GrantKYC' ||
                  API === 'TokenMint' ||
                  API === 'ERC20Transfer' ||
                  API === 'ERC721Transfer' ||
                  API === 'TokenAssociate' ||
                  API === 'TransferSingle' ||
                  API === 'QueryTokenStatus') && (
                  <Td className="cursor-pointer">
                    {transactionResult.accountAddress ? (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.accountAddress!)}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy recipient address">
                                  <p>
                                    {transactionResult.accountAddress!.slice(0, beginingHashIndex)}
                                    ...
                                    {transactionResult.accountAddress!.slice(endingHashIndex)}
                                  </p>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Tooltip
                          label={'Explore this user on HashScan'}
                          placement="top"
                          fontWeight={'medium'}
                        >
                          <Link
                            href={`https://hashscan.io/${hederaNetwork}/account/${transactionResult.accountAddress}`}
                            target="_blank"
                          >
                            <FiExternalLink />
                          </Link>
                        </Tooltip>
                      </div>
                    ) : (
                      <>
                        {API === 'TokenMint'
                          ? 'Treasury Account'
                          : `${ethers.ZeroAddress.slice(0, beginingHashIndex)}...${ethers.ZeroAddress.slice(
                              endingHashIndex
                            )}`}
                      </>
                    )}
                  </Td>
                )}

                {/* Receiver Address */}
                {(API === 'ERC20Mint' ||
                  API === 'ERC721Mint' ||
                  API === 'ERC20Transfer' ||
                  API === 'ERC721Transfer' ||
                  API === 'TransferSingle') && (
                  <Td className="cursor-pointer">
                    {transactionResult.receiverAddress ? (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.receiverAddress!)}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy recipient address">
                                  <p>
                                    {transactionResult.receiverAddress!.slice(0, beginingHashIndex)}
                                    ...
                                    {transactionResult.receiverAddress!.slice(endingHashIndex)}
                                  </p>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Tooltip
                          label={'Explore this user on HashScan'}
                          placement="top"
                          fontWeight={'medium'}
                        >
                          <Link
                            href={`https://hashscan.io/${hederaNetwork}/account/${transactionResult.receiverAddress}`}
                            target="_blank"
                          >
                            <FiExternalLink />
                          </Link>
                        </Tooltip>
                      </div>
                    ) : (
                      <>
                        {`${ethers.ZeroAddress.slice(0, beginingHashIndex)}...${ethers.ZeroAddress.slice(
                          endingHashIndex
                        )}`}
                      </>
                    )}
                  </Td>
                )}

                {/* Minted Amount */}
                {API === 'ERC20Mint' && (
                  <Td isNumeric>
                    <p>{transactionResult.mintedAmount || 'N/A'}</p>
                  </Td>
                )}

                {/* tokenID */}
                {(API === 'ERC721Mint' ||
                  API === 'ERC721OwnerOf' ||
                  API === 'ERC721TokenURI' ||
                  API === 'ERC721Approves' ||
                  API === 'ERC721Transfer') && (
                  <Td isNumeric>
                    {(() => {
                      let tokenId;
                      switch (API) {
                        case 'ERC721Mint':
                        case 'ERC721Transfer':
                          tokenId = transactionResult.tokenID;
                          break;
                        case 'ERC721TokenURI':
                          tokenId = transactionResult.tokenURI?.tokenID;
                          break;
                        case 'ERC721OwnerOf':
                          tokenId = transactionResult.ownerOf?.tokenID;
                          break;
                        case 'ERC721Approves':
                          tokenId = transactionResult.approves?.tokenID;
                          break;
                      }

                      return <p>{tokenId || 'N/A'}</p>;
                    })()}
                  </Td>
                )}

                {/* TokenURI */}
                {API === 'ERC721TokenURI' && (
                  <Td isNumeric>
                    <p>{transactionResult.tokenURI?.tokenURI || 'N/A'}</p>
                  </Td>
                )}

                {/* Transfer Amount */}
                {API === 'ERC20Transfer' && (
                  <Td isNumeric>
                    <p>{transactionResult.transferAmount || 'N/A'}</p>
                  </Td>
                )}

                {/* owner */}
                {(API === 'ERC721OwnerOf' || API === 'ERC721Approval' || API === 'ERCTokenPermission') && (
                  <Td className="cursor-pointer">
                    {(() => {
                      let owner;
                      switch (API) {
                        case 'ERC721OwnerOf':
                          owner = transactionResult.ownerOf?.owner;
                          break;
                        case 'ERC721Approval':
                          owner = transactionResult.approval?.owner;
                          break;

                        case 'ERCTokenPermission':
                          owner = transactionResult.allowances?.owner;
                          break;
                      }

                      return (
                        <>
                          {owner ? (
                            <div className="flex gap-1 items-center">
                              <div onClick={() => copyContentToClipboard(owner!)}>
                                <Popover>
                                  <PopoverTrigger>
                                    <div className="flex gap-1 items-center">
                                      <Tooltip label="click to copy recipient address">
                                        <p>
                                          {owner!.slice(0, beginingHashIndex)}
                                          ...
                                          {owner!.slice(endingHashIndex)}
                                        </p>
                                      </Tooltip>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent width={'fit-content'} border={'none'}>
                                    <div className="bg-secondary px-3 py-2 border-none font-medium">
                                      Copied
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Tooltip
                                label={'Explore this user on HashScan'}
                                placement="top"
                                fontWeight={'medium'}
                              >
                                <Link
                                  href={`https://hashscan.io/${hederaNetwork}/account/${owner}`}
                                  target="_blank"
                                >
                                  <FiExternalLink />
                                </Link>
                              </Tooltip>
                            </div>
                          ) : (
                            <>
                              {`${ethers.ZeroAddress.slice(
                                0,
                                beginingHashIndex
                              )}...${ethers.ZeroAddress.slice(endingHashIndex)}`}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </Td>
                )}

                {/* token spender */}
                {(API === 'ERCTokenPermission' || API === 'ERC721Approves') && (
                  <Td className="cursor-pointer">
                    {(() => {
                      let spender;
                      switch (API) {
                        case 'ERC721Approves':
                          spender = transactionResult.approves?.spender;
                          break;
                        case 'ERCTokenPermission':
                          spender = transactionResult.allowances?.spender;
                          break;
                      }

                      return (
                        <>
                          {spender ? (
                            <div className="flex gap-1 items-center">
                              <div onClick={() => copyContentToClipboard(spender!)}>
                                <Popover>
                                  <PopoverTrigger>
                                    <div className="flex gap-1 items-center">
                                      <Tooltip label="click to copy recipient address">
                                        <p>
                                          {spender!.slice(0, beginingHashIndex)}
                                          ...
                                          {spender!.slice(endingHashIndex)}
                                        </p>
                                      </Tooltip>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent width={'fit-content'} border={'none'}>
                                    <div className="bg-secondary px-3 py-2 border-none font-medium">
                                      Copied
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Tooltip
                                label={'Explore this user on HashScan'}
                                placement="top"
                                fontWeight={'medium'}
                              >
                                <Link
                                  href={`https://hashscan.io/${hederaNetwork}/account/${spender}`}
                                  target="_blank"
                                >
                                  <FiExternalLink />
                                </Link>
                              </Tooltip>
                            </div>
                          ) : (
                            <>
                              {`${ethers.ZeroAddress.slice(
                                0,
                                beginingHashIndex
                              )}...${ethers.ZeroAddress.slice(endingHashIndex)}`}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </Td>
                )}

                {/* operator */}
                {API === 'ERC721Approval' && (
                  <Td className="cursor-pointer">
                    {transactionResult.approval?.operator !== null ? (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.approval?.operator!)}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy recipient address">
                                  <p>
                                    {transactionResult.approval!.operator!.slice(0, beginingHashIndex)}
                                    ...
                                    {transactionResult.approval!.operator!.slice(endingHashIndex)}
                                  </p>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Tooltip
                          label={'Explore this user on HashScan'}
                          placement="top"
                          fontWeight={'medium'}
                        >
                          <Link
                            href={`https://hashscan.io/${hederaNetwork}/account/${transactionResult.approval?.operator}`}
                            target="_blank"
                          >
                            <FiExternalLink />
                          </Link>
                        </Tooltip>
                      </div>
                    ) : (
                      <>
                        {`${ethers.ZeroAddress.slice(0, beginingHashIndex)}...${ethers.ZeroAddress.slice(
                          endingHashIndex
                        )}`}
                      </>
                    )}
                  </Td>
                )}

                {/* query - isToken */}
                {API === 'QueryValidity' && (
                  <Td
                    className={`cursor-pointer ${
                      transactionResult.isToken ? `text-hedera-green` : `text-red-400`
                    }`}
                  >
                    {JSON.stringify(transactionResult.isToken).toUpperCase()}
                  </Td>
                )}

                {/* query - token info */}
                {(API === 'QueryTokenGeneralInfo' ||
                  API === 'QuerySpecificInfo' ||
                  API === 'QueryTokenPermission') && (
                  <Td className="cursor-pointer">
                    <div className="flex gap-1 items-center">
                      {typeof transactionResult.tokenInfo !== 'undefined' ? (
                        <div
                          onClick={() => {
                            onOpen!();
                            if (setShowTokenInfo) setShowTokenInfo(true);
                            if (setTokenInfoFromTxResult)
                              setTokenInfoFromTxResult(transactionResult.tokenInfo);
                            if (setAPIMethodsFromTxResult)
                              setAPIMethodsFromTxResult(transactionResult.APICalled);
                            if (setKeyTypeFromTxResult)
                              setKeyTypeFromTxResult(transactionResult.keyTypeCalled);
                            if (setTokenAddressFromTxResult)
                              setTokenAddressFromTxResult(transactionResult.tokenAddress as string);
                          }}
                        >
                          <div className="flex gap-1 items-center">
                            <Tooltip label="click to show token info">
                              <p>Token Info</p>
                            </Tooltip>
                          </div>
                        </div>
                      ) : (
                        <>NULL</>
                      )}
                    </div>
                  </Td>
                )}

                {/* operator approval status */}
                {API === 'ERC721Approval' && (
                  <Td
                    className={`cursor-pointer ${
                      transactionResult.approval?.status ? `text-hedera-green` : `text-red-400`
                    }`}
                  >
                    <div className="flex gap-1 items-center">
                      <div className="flex gap-1 items-center">
                        {JSON.stringify(transactionResult.approval?.status).toUpperCase()}
                      </div>
                    </div>
                  </Td>
                )}

                {/* query - token info - Token Relation */}
                {API === 'QueryTokenStatus' && (
                  <Td
                    className={`cursor-pointer ${
                      transactionResult.tokenInfo === 1 ? `text-hedera-green` : `text-red-400`
                    }`}
                  >
                    <div className="flex gap-1 items-center">
                      {typeof transactionResult.tokenInfo !== 'undefined' ? (
                        <div className="flex gap-1 items-center">
                          {JSON.stringify(transactionResult.tokenInfo === 1).toUpperCase()}
                        </div>
                      ) : (
                        <>NULL</>
                      )}
                    </div>
                  </Td>
                )}

                {/* Exchange Rate - Initial Amount */}
                {API === 'ExchangeRate' && (
                  <Td className="cursor-pointer">
                    <p className="w-[9rem]">{transactionResult.initialAmount}</p>
                  </Td>
                )}

                {/* Exchange Rate - ConvertedAmount */}
                {API === 'ExchangeRate' && (
                  <Td className="cursor-pointer">
                    {transactionResult.convertedAmount ? (
                      <p className="w-[9rem]">{transactionResult.convertedAmount}</p>
                    ) : (
                      <>NULL</>
                    )}
                  </Td>
                )}

                {/* PRNG - Pseudo Random Seed */}
                {API === 'PRNG' && (
                  <Td className="cursor-pointer">
                    {transactionResult.pseudoRandomSeed ? (
                      <div className="flex gap-1 items-center">
                        <div onClick={() => copyContentToClipboard(transactionResult.pseudoRandomSeed!)}>
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy seed">
                                  <p>
                                    {transactionResult.pseudoRandomSeed.slice(0, beginingHashIndex)}
                                    ...
                                    {transactionResult.pseudoRandomSeed.slice(endingHashIndex)}
                                  </p>
                                </Tooltip>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent width={'fit-content'} border={'none'}>
                              <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    ) : (
                      <>
                        {`${ethers.ZeroAddress.slice(0, beginingHashIndex)}...${ethers.ZeroAddress.slice(
                          endingHashIndex
                        )}`}
                      </>
                    )}
                  </Td>
                )}

                {/* Allowance */}
                {API === 'ERCTokenPermission' && (
                  <Td isNumeric>
                    <p>{transactionResult.allowances?.amount}</p>
                  </Td>
                )}

                {/* query - API called */}
                {(API === 'ExchangeRate' ||
                  API === 'TransferSingle' ||
                  API === 'ERC721Approves' ||
                  API === 'ERC721Approval' ||
                  API === 'QueryTokenStatus' ||
                  API === 'QuerySpecificInfo' ||
                  API === 'ERCTokenPermission' ||
                  API === 'QueryTokenPermission' ||
                  API === 'QueryTokenGeneralInfo') && (
                  <Td>
                    {transactionResult.APICalled ? (
                      <>
                        <p>
                          {transactionResult.APICalled === 'TOKEN_KEYS'
                            ? `${transactionResult.APICalled.replace('TOKEN_', '')}_${
                                transactionResult.keyTypeCalled
                              }`
                            : transactionResult.APICalled === 'DEFAULT_FREEZE_STATUS' ||
                              transactionResult.APICalled === 'DEFAULT_KYC_STATUS'
                            ? transactionResult.APICalled.replace('DEFAULT_', '')
                            : transactionResult.APICalled}
                        </p>
                      </>
                    ) : (
                      <>NULL</>
                    )}
                  </Td>
                )}

                {/* Account address - ERCBalanceOf*/}
                {API === 'ERCBalanceOf' && (
                  <Td className="cursor-pointer">
                    <div className="flex gap-1 items-center">
                      <div onClick={() => copyContentToClipboard(transactionResult.balanceOf?.owner!)}>
                        <Popover>
                          <PopoverTrigger>
                            <div className="flex gap-1 items-center">
                              <Tooltip label="click to copy recipient address">
                                <p>
                                  {transactionResult.balanceOf?.owner.slice(0, beginingHashIndex)}
                                  ...
                                  {transactionResult.balanceOf?.owner.slice(endingHashIndex)}
                                </p>
                              </Tooltip>
                            </div>
                          </PopoverTrigger>
                          <PopoverContent width={'fit-content'} border={'none'}>
                            <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Tooltip label={'Explore this user on HashScan'} placement="top" fontWeight={'medium'}>
                        <Link
                          href={`https://hashscan.io/${hederaNetwork}/account/${transactionResult.balanceOf?.owner}`}
                          target="_blank"
                        >
                          <FiExternalLink />
                        </Link>
                      </Tooltip>
                    </div>
                  </Td>
                )}

                {/* Balance - ERCBalanceOf */}
                {API === 'ERCBalanceOf' && (
                  <Td isNumeric>
                    <p>{transactionResult.balanceOf?.balance}</p>
                  </Td>
                )}

                {/* refresh button - ERC */}
                {(API === 'ERCBalanceOf' ||
                  API === 'ERC721OwnerOf' ||
                  API === 'ERC721Approves' ||
                  API === 'ERC721TokenURI' ||
                  API === 'ERC721Approval' ||
                  API === 'ERCTokenPermission') && (
                  <Td>
                    {transactionResult.readonly && (
                      <Tooltip label="refresh this record" placement="top">
                        {/* refresh button */}
                        <button
                          onClick={() => {
                            switch (API) {
                              case 'ERCBalanceOf':
                                handleReexecuteMethodAPI(transactionResult.balanceOf?.owner, true);
                                break;
                              case 'ERCTokenPermission':
                                handleReexecuteMethodAPI(
                                  'allowance',
                                  {
                                    spender: transactionResult.allowances?.spender,
                                    amount: 0,
                                    owner: transactionResult.allowances?.owner,
                                    feeValue: '',
                                  },
                                  null,
                                  true
                                );
                                break;

                              case 'ERC721TokenURI':
                                handleReexecuteMethodAPI(transactionResult.tokenURI?.tokenID, true);
                                break;

                              case 'ERC721OwnerOf':
                                handleReexecuteMethodAPI(transactionResult.ownerOf?.tokenID, true);
                                break;

                              case 'ERC721Approves':
                                handleReexecuteMethodAPI(
                                  'GET_APPROVE',
                                  { spender: '', tokenId: transactionResult.approves?.tokenID },
                                  true
                                );
                                break;

                              case 'ERC721Approval':
                                handleReexecuteMethodAPI(
                                  'IS_APPROVAL',
                                  transactionResult.approval?.owner,
                                  transactionResult.approval?.operator,
                                  true
                                );
                                break;
                            }
                          }}
                          className={`border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-teal-500 transition duration-300`}
                        >
                          <IoRefreshOutline />
                        </button>
                      </Tooltip>
                    )}
                  </Td>
                )}

                {/* delete button */}
                <Td>
                  <Tooltip label="delete this record" placement="top">
                    <button
                      onClick={() => {
                        handleRemoveRecord(transactionResult);
                      }}
                      className={`border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
                    >
                      <AiOutlineMinus />
                    </button>
                  </Tooltip>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      {/* pagination buttons */}
      <PageinationButtons
        transactionList={transactionResults}
        TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
        currentTransactionPage={currentTransactionPage}
        setCurrentTransactionPage={setCurrentTransactionPage}
      />
    </TableContainer>
  );
};
