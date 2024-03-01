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

import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';
import { Contract, isAddress } from 'ethers';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { Select, useDisclosure, useToast } from '@chakra-ui/react';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import TokenSpecificInfoModal from '../../../shared/components/TokenSpecificInfoModal';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { HederaTokenKeyTypes, TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { queryTokenSpecificInfomation } from '@/api/hedera/hts-interactions/tokenQuery-interactions';
import { htsQueryTokenInfoParamFields } from '@/utils/contract-interactions/HTS/token-query/constant';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  SharedFormButton,
  SharedFormInputField,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';
import {
  CONTRACT_NAMES,
  HEDERA_BRANDING_COLORS,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES =
  | 'TOKEN_TYPE'
  | 'TOKEN_KEYS'
  | 'CUSTOM_FEES'
  | 'TOKEN_EXPIRY'
  | 'DEFAULT_KYC_STATUS'
  | 'DEFAULT_FREEZE_STATUS';

type EVENT_NAMES =
  | 'TokenKey'
  | 'TokenType'
  | 'TokenCustomFees'
  | 'TokenExpiryInfo'
  | 'TokenDefaultKycStatus'
  | 'TokenDefaultFreezeStatus';

const QueryTokenSpecificInfomation = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const initialParamValues = { feeValue: '', hederaTokenAddress: '' };
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [tokenInfoFromTxResult, setTokenInfoFromTxResult] = useState<any>();
  const [keyType, setKeyType] = useState<IHederaTokenServiceKeyType>('ADMIN');
  const [tokenAddressFromTxResult, setTokenAddressFromTxResult] = useState('');
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('DEFAULT_FREEZE_STATUS');
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_QUERY) as string;
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const [keyTypeFromTxResult, setKeyTypeFromTxResult] = useState<IHederaTokenServiceKeyType>('ADMIN');
  const [APIMethodsFromTxResult, setAPIMethodsFromTxResult] = useState<API_NAMES>('DEFAULT_FREEZE_STATUS');
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-QUERY']['TOKEN-SPECIFIC-INFO'];

  // prepare events map
  const eventMaps: Record<API_NAMES, EVENT_NAMES> = {
    TOKEN_TYPE: 'TokenType',
    TOKEN_KEYS: 'TokenKey',
    CUSTOM_FEES: 'TokenCustomFees',
    TOKEN_EXPIRY: 'TokenExpiryInfo',
    DEFAULT_KYC_STATUS: 'TokenDefaultKycStatus',
    DEFAULT_FREEZE_STATUS: 'TokenDefaultFreezeStatus',
  };

  const transactionTypeMap = {
    TOKEN_TYPE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_TOKEN_TYPE,
    TOKEN_KEYS: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_TOKEN_KEYS,
    CUSTOM_FEES: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_CUSTOM_FEES,
    TOKEN_EXPIRY: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_TOKEN_EXPIRY,
    DEFAULT_KYC_STATUS: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_DEFAULT_KYC_STATUS,
    DEFAULT_FREEZE_STATUS: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_DEFAULT_FREEZE_STATUS,
  };

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: any }[] = [
    {
      API: 'DEFAULT_FREEZE_STATUS',
      apiSwitchTitle: 'Freeze Status',
      executeTitle: 'Query Freeze Status',
    },
    {
      API: 'DEFAULT_KYC_STATUS',
      apiSwitchTitle: 'KYC status',
      executeTitle: 'Query KYC status',
    },
    {
      API: 'TOKEN_TYPE',
      apiSwitchTitle: 'Token Type',
      executeTitle: 'Query Token Type',
    },
    {
      API: 'CUSTOM_FEES',
      apiSwitchTitle: 'Custom Fees',
      executeTitle: 'Query Custom Fees',
    },
    {
      API: 'TOKEN_EXPIRY',
      apiSwitchTitle: 'Token Exipiry',
      executeTitle: 'Query Token Exipiry',
    },
    {
      API: 'TOKEN_KEYS',
      apiSwitchTitle: 'Token Keys',
      executeTitle: 'Query Token Keys',
    },
  ];

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string) => {
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract and query token info */
  const handleQuerySpecificInfo = async (API: API_NAMES) => {
    // sanitize params
    if (!isAddress(paramValues.hederaTokenAddress)) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: 'Invalid Hedera token address',
      });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoking method API
    const tokenInfoResult = await queryTokenSpecificInfomation(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      API,
      paramValues.hederaTokenAddress,
      Number(paramValues.feeValue),
      keyType
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (tokenInfoResult.err) {
      handleAPIErrors({
        toaster,
        APICalled: API,
        setTransactionResults,
        keyTypeCalled: keyType,
        err: tokenInfoResult.err,
        transactionResultStorageKey,
        transactionType: transactionTypeMap[API],
        tokenAddress: paramValues.hederaTokenAddress,
        sessionedContractAddress: currentContractAddress,
        transactionHash: tokenInfoResult.transactionHash,
      });
      return;
    } else {
      // handle successful
      let cachedTokenInfo = null as any;
      switch (API) {
        /** @notic FREEZE_STATUS && KYC_STATUS returns boolean */
        case 'DEFAULT_FREEZE_STATUS':
        case 'DEFAULT_KYC_STATUS':
          cachedTokenInfo = JSON.stringify(Number(tokenInfoResult[eventMaps[API]]) === 1);
          setTokenInfo(cachedTokenInfo);
          break;

        /** @notice TOKEN_TYPE returns -1, 0, 1 respectively UNRECOGNIZED, FUNGIBLE_COMMON, NON_FUNGIBLE_UNIQUE */
        case 'TOKEN_TYPE':
          const tokenTypeResult = Number(tokenInfoResult[eventMaps[API]]);
          cachedTokenInfo =
            tokenTypeResult === 0
              ? 'FUNGIBLE_COMMON'
              : tokenTypeResult === 1
              ? 'NON_FUNGIBLE_UNIQUE'
              : 'UNRECOGNIZED';

          setTokenInfo(cachedTokenInfo);
          break;

        case 'CUSTOM_FEES':
        case 'TOKEN_EXPIRY':
        case 'TOKEN_KEYS':
          cachedTokenInfo = tokenInfoResult[eventMaps[API]];
          setTokenInfo(cachedTokenInfo);
      }

      // udpate transaction result
      setTransactionResults((prev) => [
        ...prev,
        {
          APICalled: API,
          status: 'success',
          keyTypeCalled: keyType,
          tokenInfo: cachedTokenInfo,
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          transactionType: transactionTypeMap[API],
          tokenAddress: paramValues.hederaTokenAddress,
          sessionedContractAddress: currentContractAddress,
          txHash: tokenInfoResult.transactionHash as string,
        },
      ]);

      // turn on successful
      setIsSuccessful(true);

      // open modal
      onOpen();
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Query token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* API methods */}
        <div className="w-full grid grid-rows-2 grid-cols-3 gap-x-6 gap-y-3">
          {APIButtonTitles.map((APIButton) => (
            <div key={APIButton.API} className="w-full">
              <SharedFormButton
                switcher={APIMethods === APIButton.API}
                buttonTitle={APIButton.apiSwitchTitle}
                handleButtonOnClick={() => setAPIMethods(APIButton.API)}
                explanation={''}
              />
            </div>
          ))}
        </div>

        {/* Hedera token address HederaTokenKeyTypes */}
        <div className={`flex gap-6`}>
          <SharedFormInputField
            param={'hederaTokenAddress'}
            handleInputOnChange={handleInputOnChange}
            paramValue={paramValues['hederaTokenAddress']}
            paramKey={(htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].paramKey}
            paramType={(htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].inputType}
            paramSize={(htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].inputSize}
            explanation={(htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].explanation}
            paramClassName={(htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].inputClassname}
            paramPlaceholder={(htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].inputPlaceholder}
            paramFocusColor={
              (htsQueryTokenInfoParamFields as any)['hederaTokenAddress'].inputFocusBorderColor
            }
          />

          {/* Key type */}
          {APIMethods === 'TOKEN_KEYS' && (
            <Select
              _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
              className="hover:cursor-pointer rounded-md border-white/30"
              onChange={(e) => setKeyType(e.target.value as IHederaTokenServiceKeyType)}
            >
              {HederaTokenKeyTypes.map((keyType) => {
                return (
                  <option key={keyType} value={keyType}>
                    {keyType}
                  </option>
                );
              })}
            </Select>
          )}
        </div>

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
            return (
              <div key={APIButton.API} className="w-full">
                {/* Execute buttons */}
                <SharedExecuteButtonWithFee
                  isLoading={isLoading}
                  feeType={'GAS'}
                  paramValues={paramValues.feeValue}
                  placeHolder={'Gas limit...'}
                  executeBtnTitle={APIButton.executeTitle}
                  handleInputOnChange={handleInputOnChange}
                  explanation={'Optional gas limit for the transaction.'}
                  handleInvokingAPIMethod={() => handleQuerySpecificInfo(APIButton.API)}
                />
              </div>
            );
          }
        })}
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          onOpen={onOpen}
          API="QuerySpecificInfo"
          hederaNetwork={HEDERA_NETWORK}
          setShowTokenInfo={setShowTokenInfo}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          setKeyTypeFromTxResult={setKeyTypeFromTxResult}
          setTokenInfoFromTxResult={setTokenInfoFromTxResult}
          setAPIMethodsFromTxResult={setAPIMethodsFromTxResult}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
          setTokenAddressFromTxResult={setTokenAddressFromTxResult}
        />
      )}

      {/* token info popup - after done calling the API */}
      {isSuccessful && (
        <TokenSpecificInfoModal
          isOpen={isOpen}
          onClose={onClose}
          keyType={keyType}
          tokenInfo={tokenInfo}
          APIMethods={APIMethods}
          setKeyType={setKeyType}
          setTokenInfo={setTokenInfo}
          hederaNetwork={HEDERA_NETWORK}
          setParamValues={setParamValues}
          setIsSuccessful={setIsSuccessful}
          initialParamValues={initialParamValues}
          hederaTokenAddress={paramValues.hederaTokenAddress}
        />
      )}

      {/* token info popup - by clicking on the `Token Info` from transaction Result table*/}
      {showTokenInfo && !isSuccessful && (
        <TokenSpecificInfoModal
          isOpen={isOpen}
          onClose={onClose}
          keyType={keyTypeFromTxResult}
          hederaNetwork={HEDERA_NETWORK}
          tokenInfo={tokenInfoFromTxResult}
          APIMethods={APIMethodsFromTxResult}
          hederaTokenAddress={tokenAddressFromTxResult}
        />
      )}
    </div>
  );
};

export default QueryTokenSpecificInfomation;
