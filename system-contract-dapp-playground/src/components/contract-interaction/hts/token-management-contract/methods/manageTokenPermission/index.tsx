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
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { manageTokenPermission } from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { htsTokenPermissionParamFields } from '@/utils/contract-interactions/HTS/token-management/constant';
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

type API_NAMES = 'APPROVED_FUNGIBLE' | 'APPROVED_NON_FUNGIBLE' | 'SET_APPROVAL';

const ManageTokenPermission = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const tokenCommonFields = ['hederaTokenAddress', 'targetApprovedAddress'];
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('APPROVED_FUNGIBLE');
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_MANAGE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-MANAGE']['TOKEN-PERMISSION'];
  const initialParamValues = {
    feeValue: '',
    serialNumber: '',
    amountToApprove: '',
    approvedStatus: false,
    hederaTokenAddress: '',
    targetApprovedAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  const transactionTypeMap = {
    SET_APPROVAL: HEDERA_COMMON_TRANSACTION_TYPE.HTS_SET_APPROVAL,
    APPROVED_FUNGIBLE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_APPROVED_TOKEN,
    APPROVED_NON_FUNGIBLE: HEDERA_COMMON_TRANSACTION_TYPE.HTS_APPROVED_NFT,
  };

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: string }[] = [
    {
      API: 'APPROVED_FUNGIBLE',
      apiSwitchTitle: 'Approve Fungible',
      executeTitle: 'Approve Fungible Token',
    },
    {
      API: 'APPROVED_NON_FUNGIBLE',
      apiSwitchTitle: 'Approve Non-Fungible',
      executeTitle: 'Approve Non-Fungible Token',
    },
    { API: 'SET_APPROVAL', apiSwitchTitle: 'Set Approval', executeTitle: 'Set Approval For All' },
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

  /** @dev handle invoking the API to interact with smart contract and update token information */
  const handleUpdateTokenPermission = async (API: API_NAMES) => {
    // destructuring param values
    const {
      feeValue,
      serialNumber,
      amountToApprove,
      approvedStatus,
      hederaTokenAddress,
      targetApprovedAddress,
    } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API,
      serialNumber,
      hederaTokenAddress,
      amount: amountToApprove,
      accountAddress: targetApprovedAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke method APIS
    const { result, transactionHash, err } = await manageTokenPermission(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      API,
      hederaTokenAddress,
      targetApprovedAddress,
      Number(feeValue),
      amountToApprove,
      serialNumber,
      approvedStatus
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err || !result) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        tokenAddress: hederaTokenAddress,
        transactionType: transactionTypeMap[API],
        sessionedContractAddress: currentContractAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          transactionResultStorageKey,
          tokenAddress: hederaTokenAddress,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          transactionType: transactionTypeMap[API],
          sessionedContractAddress: currentContractAddress,
        },
      ]);

      setIsSuccessful(true);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  /** @dev toast successful */
  useToastSuccessful({
    toaster,
    isSuccessful,
    setParamValues,
    setIsSuccessful,
    transactionResults,
    setCurrentTransactionPage,
    resetParamValues: initialParamValues,
    toastTitle: 'Token update successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Update token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* API methods */}
        <div className="flex gap-3 w-full">
          {APIButtonTitles.map((APIButton) => (
            <SharedFormButton
              key={APIButton.API}
              switcher={APIMethods === APIButton.API}
              buttonTitle={APIButton.apiSwitchTitle}
              handleButtonOnClick={() => setAPIMethods(APIButton.API)}
              explanation={''}
            />
          ))}
        </div>

        {/* hederaTokenAddress & targetApprovedAddress */}
        {tokenCommonFields.map((param) => {
          return (
            <div className="w-full" key={(htsTokenPermissionParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsTokenPermissionParamFields as any)[param].paramKey}
                paramType={(htsTokenPermissionParamFields as any)[param].inputType}
                paramSize={(htsTokenPermissionParamFields as any)[param].inputSize}
                explanation={(htsTokenPermissionParamFields as any)[param].explanation}
                paramClassName={(htsTokenPermissionParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsTokenPermissionParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsTokenPermissionParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        {/* amountToApprove field */}
        {APIMethods === 'APPROVED_FUNGIBLE' && (
          <>
            <SharedFormInputField
              param={'amountToApprove'}
              handleInputOnChange={handleInputOnChange}
              paramValue={paramValues['amountToApprove']}
              paramKey={(htsTokenPermissionParamFields as any)['amountToApprove'].paramKey}
              paramType={(htsTokenPermissionParamFields as any)['amountToApprove'].inputType}
              paramSize={(htsTokenPermissionParamFields as any)['amountToApprove'].inputSize}
              explanation={(htsTokenPermissionParamFields as any)['amountToApprove'].explanation}
              paramClassName={(htsTokenPermissionParamFields as any)['amountToApprove'].inputClassname}
              paramPlaceholder={(htsTokenPermissionParamFields as any)['amountToApprove'].inputPlaceholder}
              paramFocusColor={
                (htsTokenPermissionParamFields as any)['amountToApprove'].inputFocusBorderColor
              }
            />
          </>
        )}

        {/* amountToApprove field */}
        {APIMethods === 'APPROVED_NON_FUNGIBLE' && (
          <>
            <SharedFormInputField
              param={'serialNumber'}
              handleInputOnChange={handleInputOnChange}
              paramValue={paramValues['serialNumber']}
              paramKey={(htsTokenPermissionParamFields as any)['serialNumber'].paramKey}
              paramType={(htsTokenPermissionParamFields as any)['serialNumber'].inputType}
              paramSize={(htsTokenPermissionParamFields as any)['serialNumber'].inputSize}
              explanation={(htsTokenPermissionParamFields as any)['serialNumber'].explanation}
              paramClassName={(htsTokenPermissionParamFields as any)['serialNumber'].inputClassname}
              paramPlaceholder={(htsTokenPermissionParamFields as any)['serialNumber'].inputPlaceholder}
              paramFocusColor={(htsTokenPermissionParamFields as any)['serialNumber'].inputFocusBorderColor}
            />
          </>
        )}

        {/* approvedStatus field */}
        {APIMethods === 'SET_APPROVAL' && (
          <div className="w-full flex gap-3">
            {/* approvedStatus - false */}
            <SharedFormButton
              switcher={!paramValues.approvedStatus}
              buttonTitle={'Approved Status - false'}
              explanation={(htsTokenPermissionParamFields as any)['approvedStatus'].explanation.off}
              handleButtonOnClick={() => {
                setParamValues((prev: any) => ({ ...prev, approvedStatus: false }));
              }}
            />

            {/* approvedStatus - true */}
            <SharedFormButton
              switcher={paramValues.approvedStatus}
              buttonTitle={'Approved Status - true'}
              explanation={(htsTokenPermissionParamFields as any)['approvedStatus'].explanation.on}
              handleButtonOnClick={() => {
                setParamValues((prev: any) => ({ ...prev, approvedStatus: true }));
              }}
            />
          </div>
        )}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
            return (
              <SharedExecuteButtonWithFee
                key={APIButton.API}
                isLoading={isLoading}
                feeType={'GAS'}
                paramValues={paramValues.feeValue}
                placeHolder={'Gas limit...'}
                executeBtnTitle={APIButton.executeTitle}
                handleInputOnChange={handleInputOnChange}
                explanation={'Optional gas limit for the transaction.'}
                handleInvokingAPIMethod={() => handleUpdateTokenPermission(APIButton.API)}
              />
            );
          }
        })}
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="TokenCreate"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          setTransactionResults={setTransactionResults}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default ManageTokenPermission;
