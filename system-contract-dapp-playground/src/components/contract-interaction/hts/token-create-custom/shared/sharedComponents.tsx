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

import { ethers } from 'ethers';
import Image from 'next/image';
import { AiOutlineMinus } from 'react-icons/ai';
import { FiExternalLink } from 'react-icons/fi';
import { Dispatch, SetStateAction } from 'react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import {
  Tooltip,
  Input,
  Select,
  Link,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import {
  handleAddingOrRemovingKeys,
  handleKeyTypeOnChange,
  handleKeyValueTypeOnChange,
  handleUpdateKeyValue,
} from './sharedMethods';
import {
  CommonKeyObject,
  IHederaTokenServiceKeyType,
  IHederaTokenServiceKeyValueType,
  TransactionResult,
} from '@/types/contract-interactions/HTS';

/** @dev shared form input component */
interface SharedFormInputFieldPageProps {
  param: string;
  paramKey: string;
  paramType: string;
  paramSize: string;
  paramValue: string;
  isDisable?: boolean;
  explanation: string;
  paramClassName: string;
  paramFocusColor: string;
  paramPlaceholder: string;
  handleInputOnChange: (e: any, param: string) => void;
}

export const SharedFormInputField = ({
  param,
  paramKey,
  paramType,
  isDisable,
  paramSize,
  paramValue,
  explanation,
  paramClassName,
  paramFocusColor,
  paramPlaceholder,
  handleInputOnChange,
}: SharedFormInputFieldPageProps) => {
  return (
    <Tooltip key={paramKey} label={explanation} placement="top" fontWeight={'medium'}>
      <Input
        value={paramValue}
        disabled={isDisable}
        type={paramType}
        onChange={(e) => handleInputOnChange(e, param)}
        placeholder={paramPlaceholder}
        size={paramSize}
        focusBorderColor={paramFocusColor}
        className={paramClassName}
      />
    </Tooltip>
  );
};

/** @dev shared form button component */
interface SharedFormButtonPageProps {
  switcher: boolean;
  explanation: string;
  buttonTitle: string;
  handleButtonOnClick: any;
}

export const SharedFormButton = ({
  switcher,
  explanation,
  buttonTitle,
  handleButtonOnClick,
}: SharedFormButtonPageProps) => {
  return (
    <Tooltip label={explanation} placement="top" fontWeight={'medium'}>
      <button
        onClick={handleButtonOnClick}
        className={`border w-full rounded-md py-1 text-lg transition duration-300 ${
          switcher
            ? ` border-hedera-purple text-hedera-purple`
            : `border-white/30 hover:text-white hover:border-white`
        }`}
      >
        <p>{buttonTitle}</p>
      </button>
    </Tooltip>
  );
};

/** @dev shared execute button component */
interface SharedExecuteButtonPageProps {
  isLoading: boolean;
  buttonTitle: string;
  handleCreatingFungibleToken: () => Promise<void>;
}

export const SharedExecuteButton = ({
  isLoading,
  buttonTitle,
  handleCreatingFungibleToken,
}: SharedExecuteButtonPageProps) => {
  return (
    <button
      onClick={handleCreatingFungibleToken}
      disabled={isLoading}
      className={`w-full border py-2 rounded-xl transition duration-300 ${
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
        <>{buttonTitle}</>
      )}
    </button>
  );
};

/** @dev shared execute button with service fee component */
interface SharedExecuteButtonWithServiceFeePageProps {
  isLoading: boolean;
  paramValues: string;
  executeBtnTitle: string;
  handleCreatingFungibleToken: () => Promise<void>;
  handleInputOnChange: (e: any, param: string) => void;
}

export const SharedExecuteButtonWithServiceFee = ({
  isLoading,
  paramValues,
  executeBtnTitle,
  handleInputOnChange,
  handleCreatingFungibleToken,
}: SharedExecuteButtonWithServiceFeePageProps) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-6">
        {/* Service Fee */}
        <div className="w-3/12">
          <SharedFormInputField
            param={'msgValue'}
            paramValue={paramValues}
            handleInputOnChange={handleInputOnChange}
            paramSize={'lg'}
            paramType={'number'}
            paramKey={'msgValue'}
            explanation={
              'Represents the fee in HBAR directly paid to the contract system of the Hedera Token Service'
            }
            paramClassName={'border-white/30 rounded-xl'}
            paramPlaceholder={'Service fee...'}
            paramFocusColor={'#A98DF4'}
          />
        </div>
        {/* Execute button */}
        <div className=" w-9/12">
          <SharedExecuteButton
            isLoading={isLoading}
            buttonTitle={executeBtnTitle}
            handleCreatingFungibleToken={handleCreatingFungibleToken}
          />
        </div>
      </div>
      <p className="text-sm whitespace-normal">
        <span className="italic font-medium text-sm">*Important:</span> Varying configurations
        applied to the token will result in varying service fees. Be sure to utilize the{' '}
        <Link
          className="underline text-hedera-green font-medium whitespace-nowrap"
          href={'https://hedera.com/fees'}
          target="_blank"
        >
          Hedera service fee calculator
        </Link>{' '}
        for precise estimation of the applicable fee, as this fee is non-refundable.
      </p>
    </div>
  );
};

/** @dev shared component presenting signing keys*/
interface SigningKeyPageProps {
  keys: CommonKeyObject[];
  chosenKeys: Set<IHederaTokenServiceKeyType>;
  keyTypesToShow: Set<IHederaTokenServiceKeyType>;
  HederaTokenKeyTypes: IHederaTokenServiceKeyType[];
  setKeys: Dispatch<SetStateAction<CommonKeyObject[]>>;
  HederaTokenKeyValueType: IHederaTokenServiceKeyValueType[];
  setChosenKeys: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>;
  setKeyTypesToShow: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>;
}

export const SharedSigningKeysComponent = ({
  keys,
  setKeys,
  chosenKeys,
  setChosenKeys,
  keyTypesToShow,
  setKeyTypesToShow,
  HederaTokenKeyTypes,
  HederaTokenKeyValueType,
}: SigningKeyPageProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-6">
        {/* Add more key */}
        <div className="flex flex-col gap-0">
          {keys.length < 7 && (
            <Tooltip
              label={keys.length !== 0 && 'Add more keys'}
              placement="top"
              fontWeight={'medium'}
            >
              <button
                onClick={() =>
                  handleAddingOrRemovingKeys(
                    'ADD',
                    chosenKeys,
                    HederaTokenKeyTypes,
                    setKeys,
                    setChosenKeys,
                    setKeyTypesToShow
                  )
                }
                className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
              >
                {keys.length === 0 ? `Add signing keys to the token` : '+'}
              </button>
            </Tooltip>
          )}
        </div>

        {/* Key wrapper */}
        {keys.map((key) => (
          <div key={key.keyType} className="flex gap-3 items-center">
            {/* Key Type & Key Value Type */}
            <div className="flex gap-3">
              {/* Key type */}
              <Select
                _focus={{ borderColor: '#A98DF4' }}
                placeholder={key.keyType}
                className="w-[120px] hover:cursor-pointer rounded-md border-white/30"
                onChange={(e) =>
                  handleKeyTypeOnChange(e, key, setKeys, setChosenKeys, setKeyTypesToShow)
                }
              >
                {Array.from(keyTypesToShow).map((keyType) => {
                  return (
                    <option key={keyType} value={keyType}>
                      {keyType}
                    </option>
                  );
                })}
              </Select>

              {/* Key Value type */}
              <Select
                _focus={{ borderColor: '#A98DF4' }}
                className="w-[220px] hover:cursor-pointer rounded-md border-white/30"
                onChange={(e) => handleKeyValueTypeOnChange(e, key, setKeys)}
              >
                {HederaTokenKeyValueType.map((keyType) => {
                  return (
                    <option key={keyType} value={keyType}>
                      {convertCalmelCaseFunctionName(keyType)}
                    </option>
                  );
                })}
              </Select>
            </div>

            {/* Key value */}
            <div className="w-full">
              {key.keyValueType === 'inheritAccountKey' ? (
                <Select
                  _focus={{ borderColor: '#A98DF4' }}
                  className="hover:cursor-pointer rounded-md border-white/30"
                  placeholder="Select option"
                  onChange={(e) => handleUpdateKeyValue(e, key, setKeys)}
                >
                  <option value={'false'}>false</option>
                  <option value={'true'}>true</option>
                </Select>
              ) : (
                <Input
                  value={key.keyValue as string}
                  type={'text'}
                  onChange={(e) => handleUpdateKeyValue(e, key, setKeys)}
                  placeholder={
                    key.keyValueType === 'contractId' ||
                    key.keyValueType === 'delegatableContractId'
                      ? 'ID of a smart contract instance...'
                      : `${key.keyValueType.split('_')[0].toUpperCase()} compressed public key...`
                  }
                  size={'md'}
                  focusBorderColor={'#A98DF4'}
                  className={'w-full border-white/30'}
                />
              )}
            </div>

            {/* delete key button */}
            <Tooltip label="delete this record" placement="top">
              <button
                onClick={() =>
                  handleAddingOrRemovingKeys(
                    'REMOVE',
                    chosenKeys,
                    HederaTokenKeyTypes,
                    setKeys,
                    setChosenKeys,
                    setKeyTypesToShow,
                    key.keyType
                  )
                }
                className={`border h-fit border-white/30 text-base px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
              >
                <AiOutlineMinus />
              </button>
            </Tooltip>
          </div>
        ))}
      </div>

      {/* tip link */}
      {keys.length > 0 && (
        <small className="text-sm">
          For comprehensive details about keys, please visit{' '}
          <Link
            href={
              'https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L116'
            }
            target="_blank"
            className="text-hedera-purple underline font-medium"
          >
            this resource.
          </Link>
        </small>
      )}
    </div>
  );
};

/** @dev shared component representing the list of transactions */
interface TransactionResultTablePageProps {
  hederaNetwork: string;
  TRANSACTION_PAGE_SIZE: number;
  currentTransactionPage: number;
  transactionResultStorageKey: string;
  transactionResults: TransactionResult[];
  paginatedTransactionResults: TransactionResult[];
  setCurrentTransactionPage: Dispatch<SetStateAction<number>>;
  API: 'TokenCreate' | 'TokenMint' | 'TokenAssociate' | 'GrantKYC';
  setTransactionResults: Dispatch<SetStateAction<TransactionResult[]>>;
}

export const TransactionResultTable = ({
  API,
  hederaNetwork,
  transactionResults,
  TRANSACTION_PAGE_SIZE,
  setTransactionResults,
  currentTransactionPage,
  setCurrentTransactionPage,
  transactionResultStorageKey,
  paginatedTransactionResults,
}: TransactionResultTablePageProps) => {
  let beginingHashIndex: number, endingHashIndex: number;
  switch (API) {
    case 'TokenCreate':
      beginingHashIndex = 15;
      endingHashIndex = -12;
      break;
    case 'TokenMint':
      beginingHashIndex = 8;
      endingHashIndex = -4;
      break;
    case 'TokenAssociate':
    case 'GrantKYC':
      beginingHashIndex = 10;
      endingHashIndex = -5;
      break;
  }

  return (
    <TableContainer className="flex flex-col gap-3 overflow-x-hidden">
      <Table variant="simple" size={'sm'}>
        <Thead>
          <Tr>
            <Th color={'#82ACF9'} isNumeric className="flex justify-start">
              Index
            </Th>
            <Th color={'#82ACF9'}>Status</Th>
            <Th color={'#82ACF9'}>Transaction hash</Th>
            <Th color={'#82ACF9'}>Token address</Th>
            {API === 'TokenMint' && <Th color={'#82ACF9'}>Recipient</Th>}
            {API === 'TokenAssociate' && <Th color={'#82ACF9'}>Associated Account</Th>}
            {API === 'GrantKYC' && <Th color={'#82ACF9'}>KYCed Account</Th>}
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {paginatedTransactionResults.map((transactionResult, index) => {
            /** @dev handle removing record */
            const handleRemoveRecord = (targetTransactionResult: TransactionResult) => {
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
                  transactionResult.status === 'sucess'
                    ? 'hover:bg-hedera-green/10'
                    : 'hover:bg-red-400/10'
                }
              >
                {/* index */}
                <Td>
                  <p>{index + (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE + 1}</p>
                </Td>

                {/* status */}
                <Td>
                  <p
                    className={
                      transactionResult.status === 'sucess' ? `text-hedera-green` : `text-red-400`
                    }
                  >
                    {transactionResult.status.toUpperCase()}
                  </p>
                </Td>

                {/* transaction hash */}
                <Td className="cursor-pointer">
                  <div className="flex gap-1 items-center">
                    <div onClick={() => navigator.clipboard.writeText(transactionResult.txHash)}>
                      <Popover>
                        <PopoverTrigger>
                          <div className="flex gap-1 items-center">
                            <Tooltip label="click to copy transaction hash">
                              {/* {withTokenAddress ? ( */}
                              <p>
                                {transactionResult.txHash.slice(0, beginingHashIndex)}...
                                {transactionResult.txHash.slice(endingHashIndex)}
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
                </Td>

                {/* token address */}
                {(API === 'TokenCreate' || API === 'TokenMint' || API === 'GrantKYC') && (
                  <Td className="cursor-pointer">
                    {transactionResult.tokenAddress ? (
                      <div className="flex gap-1 items-center">
                        <div
                          onClick={() =>
                            navigator.clipboard.writeText(transactionResult.tokenAddress!)
                          }
                        >
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
                            href={`https://hashscan.io/${hederaNetwork}/token/${transactionResult.tokenAddress}`}
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
                  </Td>
                )}

                {/* associated token address */}
                {API === 'TokenAssociate' && (
                  <Td className="cursor-pointer">
                    {transactionResult.tokenAddresses &&
                    transactionResult.tokenAddresses.length === 1 ? (
                      <div className="flex gap-1 items-center">
                        <div
                          onClick={() =>
                            navigator.clipboard.writeText(transactionResult.tokenAddresses![0])
                          }
                        >
                          <Popover>
                            <PopoverTrigger>
                              <div className="flex gap-1 items-center">
                                <Tooltip label="click to copy token address">
                                  <p>
                                    {transactionResult.tokenAddresses[0].slice(
                                      0,
                                      beginingHashIndex
                                    )}
                                    ...
                                    {transactionResult.tokenAddresses[0].slice(endingHashIndex)}
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
                              <div
                                key={token}
                                className="bg-secondary border-none font-medium flex gap-1"
                              >
                                <div onClick={() => navigator.clipboard.writeText(token)}>
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

                {/* Account address */}
                {(API === 'TokenMint' || API === 'TokenAssociate' || API === 'GrantKYC') && (
                  <Td className="cursor-pointer">
                    {transactionResult.accountAddress ? (
                      <div className="flex gap-1 items-center">
                        <div
                          onClick={() =>
                            navigator.clipboard.writeText(transactionResult.accountAddress!)
                          }
                        >
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
                          : `${ethers.ZeroAddress.slice(
                              0,
                              beginingHashIndex
                            )}...${ethers.ZeroAddress.slice(endingHashIndex)}`}
                      </>
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
      <div className="flex gap-3 justify-center items-center">
        <Tooltip label="Return to the previous page">
          <button
            onClick={() => setCurrentTransactionPage((prev) => prev - 1)}
            disabled={currentTransactionPage === 1}
            className={`border rounded-lg border-white/30 text-2xl ${
              currentTransactionPage === 1
                ? 'hover:cursor-not-allowed text-white/30'
                : 'hover:cursor-pointer text-white'
            }`}
          >
            <MdNavigateBefore />
          </button>
        </Tooltip>
        <p className="text-base">{currentTransactionPage}</p>
        <Tooltip label="Proceed to the next page">
          <button
            onClick={() => setCurrentTransactionPage((prev) => prev + 1)}
            disabled={paginatedTransactionResults.length < TRANSACTION_PAGE_SIZE}
            className={`border border-white/30 rounded-lg text-2xl cursor-pointer ${
              paginatedTransactionResults.length < TRANSACTION_PAGE_SIZE
                ? 'hover:cursor-not-allowed text-white/30'
                : 'hover:cursor-pointer text-white'
            }`}
          >
            <MdNavigateNext />
          </button>
        </Tooltip>
      </div>
    </TableContainer>
  );
};
