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
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import TokenPermissionInfoModal from '../../../shared/components/TokenPermissionInfoModal';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { queryTokenPermissionInformation } from '@/api/hedera/hts-interactions/tokenQuery-interactions';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { htsQueryTokenPermissionParamFields } from '@/utils/contract-interactions/HTS/token-query/constant';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  SharedFormButton,
  SharedFormInputField,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'ALLOWANCE' | 'GET_APPROVED' | 'IS_APPROVAL';
type EVENT_NAMES = 'Approved' | 'AllowanceValue' | 'ApprovedAddress';

const QueryTokenPermissionInfomation = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('ALLOWANCE');
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [tokenInfoFromTxResult, setTokenInfoFromTxResult] = useState<any>();
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_QUERY) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const [APIMethodsFromTxResult, setAPIMethodsFromTxResult] = useState<API_NAMES>('ALLOWANCE');
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-QUERY']['TOKEN-PERMISSION'];
  const initialParamValues = {
    feeValue: '',
    hederaTokenAddress: '',
    ownerAddress: '',
    spenderAddress: '',
    serialNumber: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  const tokenCommonFields = useMemo(() => {
    switch (APIMethods) {
      case 'ALLOWANCE':
      case 'IS_APPROVAL':
        return ['hederaTokenAddress', 'ownerAddress', 'spenderAddress'];
      case 'GET_APPROVED':
        return ['hederaTokenAddress', 'serialNumber'];
    }
  }, [APIMethods]);

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: any }[] = [
    {
      API: 'ALLOWANCE',
      apiSwitchTitle: 'Allowance',
      executeTitle: 'Query Allowance Value',
    },
    {
      API: 'GET_APPROVED',
      apiSwitchTitle: 'Get Approved',
      executeTitle: 'Query Approved Address',
    },
    {
      API: 'IS_APPROVAL',
      apiSwitchTitle: 'Is Approval',
      executeTitle: 'Query Approval Status',
    },
  ];

  // prepare events map
  const eventMaps: Record<API_NAMES, EVENT_NAMES> = {
    IS_APPROVAL: 'Approved',
    ALLOWANCE: 'AllowanceValue',
    GET_APPROVED: 'ApprovedAddress',
  };

  const transactionTypeMap = {
    ALLOWANCE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_ALLOWANCE,
    IS_APPROVAL: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_IS_APPROVAL,
    GET_APPROVED: HEDERA_COMMON_TRANSACTION_TYPE.HTS_QUERY_GET_APPROVED,
  };

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
  const handleQueryTokenPermissionInfo = async (API: API_NAMES) => {
    // destructuring param values
    const { hederaTokenAddress, ownerAddress, spenderAddress, serialNumber } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API,
      hederaTokenAddress,
      ownerAddress,
      serialNumber,
      spenderAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoking method API
    const tokenInfoResult = await queryTokenPermissionInformation(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      API,
      hederaTokenAddress,
      Number(paramValues.feeValue),
      ownerAddress,
      spenderAddress,
      serialNumber
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (tokenInfoResult.err) {
      handleAPIErrors({
        toaster,
        APICalled: API,
        setTransactionResults,
        err: tokenInfoResult.err,
        transactionResultStorageKey,
        transactionType: transactionTypeMap[API],
        tokenAddress: paramValues.hederaTokenAddress,
        transactionHash: tokenInfoResult.transactionHash,
        sessionedContractAddress: currentContractAddress,
      });
      return;
    } else {
      // handle successful
      let cachedTokenInfo = null as any;
      if (API === 'GET_APPROVED') {
        cachedTokenInfo = `0x${tokenInfoResult[eventMaps[API]].slice(-40)}`;
        setTokenInfo(cachedTokenInfo);
      } else {
        cachedTokenInfo = Number(tokenInfoResult[eventMaps[API]]);
        setTokenInfo(cachedTokenInfo);
      }

      // udpate transaction result
      setTransactionResults((prev) => [
        ...prev,
        {
          APICalled: API,
          status: 'success',
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
        <div className="w-full flex gap-3">
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

        {/* hederaTokenAddress & targetApprovedAddress */}
        {tokenCommonFields.map((param) => {
          return (
            <div className="w-full" key={(htsQueryTokenPermissionParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsQueryTokenPermissionParamFields as any)[param].paramKey}
                paramType={(htsQueryTokenPermissionParamFields as any)[param].inputType}
                paramSize={(htsQueryTokenPermissionParamFields as any)[param].inputSize}
                explanation={(htsQueryTokenPermissionParamFields as any)[param].explanation}
                paramClassName={(htsQueryTokenPermissionParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsQueryTokenPermissionParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsQueryTokenPermissionParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

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
                  handleInvokingAPIMethod={() => handleQueryTokenPermissionInfo(APIButton.API)}
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
          API="QueryTokenPermission"
          hederaNetwork={HEDERA_NETWORK}
          setShowTokenInfo={setShowTokenInfo}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          setTokenInfoFromTxResult={setTokenInfoFromTxResult}
          setCurrentTransactionPage={setCurrentTransactionPage}
          setAPIMethodsFromTxResult={setAPIMethodsFromTxResult}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}

      {/* token info popup - after done calling the API */}
      {isSuccessful && (
        <TokenPermissionInfoModal
          APIMethods={APIMethods}
          tokenInfo={tokenInfo}
          eventMaps={eventMaps}
          isOpen={isOpen}
          onClose={onClose}
          initialParamValues={initialParamValues}
          setTokenInfo={setTokenInfo}
          setParamValues={setParamValues}
          setIsSuccessful={setIsSuccessful}
        />
      )}

      {/* token info popup - by clicking on the `Token Info` from transaction Result table*/}
      {showTokenInfo && !isSuccessful && (
        <TokenPermissionInfoModal
          APIMethods={APIMethodsFromTxResult}
          tokenInfo={tokenInfoFromTxResult}
          eventMaps={eventMaps}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default QueryTokenPermissionInfomation;
