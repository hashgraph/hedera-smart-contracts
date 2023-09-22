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
import { Contract } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import TokenGeneralInfoModal from '../../../shared/components/TokenGeneralInfoModal';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { CONTRACT_NAMES, HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { queryTokenGeneralInfomation } from '@/api/hedera/hts-interactions/tokenQuery-interactions';
import { htsQueryTokenInfoParamFields } from '@/utils/contract-interactions/HTS/token-query/constant';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  SharedFormButton,
  SharedExecuteButton,
  SharedFormInputField,
} from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'TOKEN' | 'FUNGIBLE' | 'NON_FUNFIBLE';
type EVENT_NAMES = 'TokenInfo' | 'FungibleTokenInfo' | 'NonFungibleTokenInfo';

const QueryTokenGeneralInfomation = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('TOKEN');
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [tokenInfoFromTxResult, setTokenInfoFromTxResult] = useState<any>();
  const [tokenAddressFromTxResult, setTokenAddressFromTxResult] = useState('');
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_QUERY) as string;
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-QUERY']['TOKEN-GENERAL-INFO'];
  const [APIMethodsFromTxResult, setAPIMethodsFromTxResult] = useState<API_NAMES>('TOKEN');
  const initialParamValues = {
    serialNumber: '',
    hederaTokenAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const tokenCommonFields = useMemo(() => {
    if (APIMethods === 'NON_FUNFIBLE') {
      return ['hederaTokenAddress', 'serialNumber'];
    } else {
      return ['hederaTokenAddress'];
    }
  }, [APIMethods]);

  // prepare events map
  const eventMaps: Record<API_NAMES, EVENT_NAMES> = {
    TOKEN: 'TokenInfo',
    FUNGIBLE: 'FungibleTokenInfo',
    NON_FUNFIBLE: 'NonFungibleTokenInfo',
  };

  const transactionTypeMap = {
    TOKEN: 'HTS-QUERY-TOKEN-INFO',
    FUNGIBLE: 'HTS-QUERY-FUNGIBLE-INFO',
    NON_FUNFIBLE: 'HTS-QUERY-NFT-INFO',
  };

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: any }[] = [
    {
      API: 'TOKEN',
      apiSwitchTitle: 'Token Info',
      executeTitle: 'Query General Token Info',
    },
    {
      API: 'FUNGIBLE',
      apiSwitchTitle: 'Fungible Info',
      executeTitle: 'Query Fungible Token Info',
    },
    {
      API: 'NON_FUNFIBLE',
      apiSwitchTitle: 'Non-Fungible Info',
      executeTitle: 'Query Non-Fungible Token Info',
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
  /** @NOTICE WILL COME BACK SOON */
  const handleQueryTokenInfo = async (API: API_NAMES) => {
    // destructuring param values
    const { hederaTokenAddress, serialNumber } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'QueryTokenInfo',
      hederaTokenAddress,
      serialNumber,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoking method API
    const { transactionHash, err, ...tokenInfoResult } = await queryTokenGeneralInfomation(
      baseContract,
      API,
      hederaTokenAddress,
      serialNumber
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err) {
      handleAPIErrors({
        toaster,
        err: err,
        setTransactionResults,
        transactionHash: transactionHash,
        transactionType: transactionTypeMap[API],
        tokenAddress: paramValues.hederaTokenAddress,
        sessionedContractAddress: currentContractAddress,
      });
      return;
    } else {
      setTokenInfo(tokenInfoResult[eventMaps[API]]);

      setTransactionResults((prev) => [
        ...prev,
        {
          APICalled: API,
          status: 'success',
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          transactionType: transactionTypeMap[API],
          tokenInfo: tokenInfoResult[eventMaps[API]],
          tokenAddress: paramValues.hederaTokenAddress,
          sessionedContractAddress: currentContractAddress,
        },
      ]);
      setIsSuccessful(true);
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
        <div className="w-full flex gap-3">
          {APIButtonTitles.map((APIButton) => (
            <div key={APIButton.API} className="w-full">
              <SharedFormButton
                explanation={''}
                buttonTitle={APIButton.apiSwitchTitle}
                switcher={APIMethods === APIButton.API}
                handleButtonOnClick={() => setAPIMethods(APIButton.API)}
              />
            </div>
          ))}
        </div>

        {/* hederaTokenAddress & targetApprovedAddress */}
        {tokenCommonFields.map((param) => {
          return (
            <div className="w-full" key={(htsQueryTokenInfoParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsQueryTokenInfoParamFields as any)[param].paramKey}
                paramSize={(htsQueryTokenInfoParamFields as any)[param].inputSize}
                paramType={(htsQueryTokenInfoParamFields as any)[param].inputType}
                explanation={(htsQueryTokenInfoParamFields as any)[param].explanation}
                paramClassName={(htsQueryTokenInfoParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsQueryTokenInfoParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsQueryTokenInfoParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedExecuteButton
                  isLoading={isLoading}
                  handleCreatingFungibleToken={() => handleQueryTokenInfo(APIButton.API)}
                  buttonTitle={APIButton.executeTitle}
                />
              </div>
            );
          }
        })}
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="QueryTokenGeneralInfo"
          onOpen={onOpen}
          hederaNetwork={hederaNetwork}
          setShowTokenInfo={setShowTokenInfo}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          setTokenInfoFromTxResult={setTokenInfoFromTxResult}
          setCurrentTransactionPage={setCurrentTransactionPage}
          setAPIMethodsFromTxResult={setAPIMethodsFromTxResult}
          setTokenAddressFromTxResult={setTokenAddressFromTxResult}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}

      {/* token info popup - after done calling the API */}
      {isSuccessful && (
        <TokenGeneralInfoModal
          isOpen={isOpen}
          onClose={onClose}
          tokenInfo={tokenInfo}
          APIMethods={APIMethods}
          setTokenInfo={setTokenInfo}
          hederaNetwork={hederaNetwork}
          setParamValues={setParamValues}
          setIsSuccessful={setIsSuccessful}
          initialParamValues={initialParamValues}
          hederaTokenAddress={paramValues.hederaTokenAddress}
        />
      )}

      {/* token info popup - by clicking on the `Token Info` from transaction Result table*/}
      {showTokenInfo && !isSuccessful && (
        <TokenGeneralInfoModal
          isOpen={isOpen}
          onClose={onClose}
          hederaNetwork={hederaNetwork}
          tokenInfo={tokenInfoFromTxResult}
          APIMethods={APIMethodsFromTxResult}
          hederaTokenAddress={tokenAddressFromTxResult}
        />
      )}
    </div>
  );
};

export default QueryTokenGeneralInfomation;
