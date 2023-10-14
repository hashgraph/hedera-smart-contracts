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
import { useEffect, useMemo, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { handleAPIErrors } from '../../../shared/methods/handleAPIErrors';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../shared/hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../shared/hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../shared/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../shared/methods/handleSanitizeFormInputs';
import { SmartContractExecutionResult, TransactionResult } from '@/types/contract-interactions/HTS';
import { useUpdateTransactionResultsToLocalStorage } from '../../../shared/hooks/useUpdateLocalStorage';
import { htsMultiTokensTransferParamFields } from '@/utils/contract-interactions/HTS/token-transfer/paramFieldConstant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  transferFungibleTokens,
  transferNonFungibleTokens,
} from '@/api/hedera/tokenTransfer-interactions';
import {
  FungibleParamValue,
  NonFungibleParamValue,
  generateInitialFungibleParamValue,
  generateInitialNonFungibleParamValue,
} from './helpers/generateInitialValues';
import {
  SharedFormButton,
  SharedFormInputField,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';
import TransferRecordForm from './TransferRecordForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'FUNGIBLE' | 'NON_FUNGIBLE';

const TransferMultipleTokens = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState({
    FUNGIBLE: false,
    NON_FUNGIBLE: false,
  });
  const [isSuccessful, setIsSuccessful] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('FUNGIBLE');
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const contractCaller = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey = 'HEDERA.HTS.TOKEN-TRANSFER.MULTIPLE-TOKENS-RESULTS';
  const tokenCommonFields = useMemo(() => {
    if (APIMethods === 'FUNGIBLE') {
      return ['hederaTokenAddress', 'accountIDs', 'amounts'];
    } else {
      return ['hederaTokenAddress', 'senders', 'receivers', 'serialNumbers'];
    }
  }, [APIMethods]);
  const initialCommonParamValue = { hederaTokenAddress: '', feeValue: '' };
  const [commonParamValues, setCommonParamValues] = useState(initialCommonParamValue);

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: any }[] = [
    {
      API: 'FUNGIBLE',
      apiSwitchTitle: 'Fungible Token',
      executeTitle: 'Transfer Fungible Tokens',
    },
    {
      API: 'NON_FUNGIBLE',
      apiSwitchTitle: 'Non-Fungible Token',
      executeTitle: 'Transfer Non-Fungible Tokens',
    },
  ];

  const [fungibleParamValues, setFungibleParamValues] = useState([
    generateInitialFungibleParamValue(),
  ]);
  const [nonFungibleParamValues, setNonFungibleParamValues] = useState([
    generateInitialNonFungibleParamValue(),
  ]);

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(
    currentTransactionPage,
    transactionResults
  );

  /** @dev handle modifying transfer records */
  const handleModifyTransferRecords = (
    type: 'ADD' | 'REMOVE',
    paramValues?: FungibleParamValue[] | NonFungibleParamValue[],
    setParamValues?: any,
    removingFieldKey?: string,
    initialParamVaue?: any
  ) => {
    switch (type) {
      case 'ADD':
        setParamValues((prev: any) => [...prev, initialParamVaue]);
        break;
      case 'REMOVE':
        if (paramValues!.length > 1) {
          setParamValues((prev: any) =>
            prev.filter((field: any) => field.fieldKey !== removingFieldKey)
          );
        }
    }
  };

  /** @dev handle form inputs on change */
  const handleInputOnChange = (
    e: any,
    mode: 'COMMON' | 'UNIQUE',
    param: string,
    fieldKey?: string,
    setParamValues?: any
  ) => {
    if (mode === 'COMMON') {
      setCommonParamValues((prev) => ({ ...prev, [param]: e.target.value }));
    } else {
      setParamValues((prev: any) =>
        prev.map((field: any) => {
          if (field.fieldKey === fieldKey) {
            field.fieldValue[param] = e.target.value;
          }
          return field;
        })
      );
    }
  };

  /** @dev handle invoking the API to interact with smart contract and transfer multiple tokens */
  const handleTransferMultipleTokens = async (API: API_NAMES) => {
    // destructuring params
    const { hederaTokenAddress, feeValue } = commonParamValues;

    // extract fungibleParamsAccountIDs && fungibleParamsAmmounts  array
    const fungibleParamsAccountIDs = fungibleParamValues.map(
      (prev) => prev.fieldValue.receiverAddress
    );
    fungibleParamsAccountIDs.unshift(contractCaller); // add contractCaller to the beginning of the list

    let amountTotal = 0;
    const fungibleParamsAmmounts = fungibleParamValues.map((prev) => {
      amountTotal += Number(prev.fieldValue.amount);
      return Number(prev.fieldValue.amount);
    });
    fungibleParamsAmmounts.unshift(amountTotal * -1); // add the negative total amount to the beginning of the list

    // extract nonFungibleParamsSenders, nonFungibleParamsReceivers && nonFungibleParamsSerialNumbers  array
    const nonFungibleParamsSenders = nonFungibleParamValues.map(
      (prev) => prev.fieldValue.senderAddress
    );
    const nonFungibleParamsReceivers = nonFungibleParamValues.map(
      (prev) => prev.fieldValue.receiverAddress
    );
    const nonFungibleParamsSerialNumbers = nonFungibleParamValues.map((prev) =>
      Number(prev.fieldValue.serialNumber)
    );

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: `MULTI_${API}`,
      fungibleReceivers: fungibleParamsAccountIDs,
      amounts: fungibleParamsAmmounts.slice(1),
      senders: nonFungibleParamsSenders,
      nonFungibleReceivers: nonFungibleParamsReceivers,
      serialNumbers: nonFungibleParamsSerialNumbers,
      feeValue,
      hederaTokenAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn isLoading on
    setIsLoading({
      FUNGIBLE: API === 'FUNGIBLE',
      NON_FUNGIBLE: API === 'NON_FUNGIBLE',
    });

    let transactionResult: SmartContractExecutionResult;
    if (API === 'FUNGIBLE') {
      transactionResult = await transferFungibleTokens(
        baseContract,
        hederaTokenAddress,
        fungibleParamsAccountIDs,
        fungibleParamsAmmounts,
        Number(feeValue)
      );
    } else {
      transactionResult = await transferNonFungibleTokens(
        baseContract,
        hederaTokenAddress,
        nonFungibleParamsSenders,
        nonFungibleParamsReceivers,
        nonFungibleParamsSerialNumbers,
        Number(feeValue)
      );
    }

    // turn isLoading off
    setIsLoading({
      FUNGIBLE: API === 'FUNGIBLE' && false,
      NON_FUNGIBLE: API === 'NON_FUNGIBLE' && false,
    });

    // handle err
    if (transactionResult.err || !transactionResult.result) {
      handleAPIErrors({
        toaster,
        APICalled: API,
        setTransactionResults,
        err: transactionResult.err,
        tokenAddress: commonParamValues.hederaTokenAddress,
        transactionHash: transactionResult.transactionHash,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          APICalled: API,
          status: 'success',
          tokenAddress: commonParamValues.hederaTokenAddress,
          txHash: transactionResult.transactionHash as string,
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
    setIsSuccessful,
    transactionResults,
    setFungibleParamValues,
    setNonFungibleParamValues,
    setCurrentTransactionPage,
    setParamValues: setCommonParamValues,
    toastTitle: 'Token update successful',
    resetParamValues: initialCommonParamValue,
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Transfer Token form */}
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

        {/* Hedera token address */}
        <SharedFormInputField
          param={'hederaTokenAddress'}
          handleInputOnChange={(e: any) => handleInputOnChange(e, 'COMMON', 'hederaTokenAddress')}
          paramValue={commonParamValues.hederaTokenAddress}
          paramKey={(htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].paramKey}
          paramType={(htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].inputType}
          paramSize={(htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].inputSize}
          explanation={(htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].explanation}
          paramClassName={
            (htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].inputClassname
          }
          paramPlaceholder={
            (htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].inputPlaceholder
          }
          paramFocusColor={
            (htsMultiTokensTransferParamFields as any)['hederaTokenAddress'].inputFocusBorderColor
          }
        />

        {/* Add tokenAddresses */}
        <div className="flex flex-col gap-0">
          <button
            onClick={() =>
              handleModifyTransferRecords(
                'ADD',
                undefined,
                APIMethods === 'FUNGIBLE' ? setFungibleParamValues : setNonFungibleParamValues,
                undefined,
                APIMethods === 'FUNGIBLE'
                  ? generateInitialFungibleParamValue()
                  : generateInitialNonFungibleParamValue()
              )
            }
            className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
          >
            Add more transfer records
          </button>
        </div>

        {/* Fungible Tokens Form */}
        {APIMethods === 'FUNGIBLE' && (
          <>
            {fungibleParamValues.map((paramValue) => (
              <TransferRecordForm
                key={paramValue.fieldKey}
                paramValue={paramValue}
                paramValues={fungibleParamValues}
                setParamValues={setFungibleParamValues}
                handleInputOnChange={handleInputOnChange}
                handleModifyTransferRecords={handleModifyTransferRecords}
                paramKeys={['receiverAddress', 'amount'] as ('receiverAddress' | 'amount')[]}
              />
            ))}
          </>
        )}

        {/* Non Fungible Tokens Form */}
        {APIMethods === 'NON_FUNGIBLE' && (
          <>
            {nonFungibleParamValues.map((paramValue) => (
              <TransferRecordForm
                key={paramValue.fieldKey}
                paramValue={paramValue}
                paramValues={nonFungibleParamValues}
                setParamValues={setNonFungibleParamValues}
                handleInputOnChange={handleInputOnChange}
                handleModifyTransferRecords={handleModifyTransferRecords}
                paramKeys={
                  ['senderAddress', 'receiverAddress', 'serialNumber'] as (
                    | 'senderAddress'
                    | 'receiverAddress'
                    | 'serialNumber'
                  )[]
                }
              />
            ))}
          </>
        )}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
            return (
              <SharedExecuteButtonWithFee
                key={APIButton.API}
                isLoading={isLoading[APIButton.API]}
                feeType={'GAS'}
                paramValues={commonParamValues.feeValue}
                placeHolder={'Gas limit...'}
                executeBtnTitle={APIButton.executeTitle}
                handleInputOnChange={(e) => handleInputOnChange(e, 'COMMON', 'feeValue')}
                explanation={'Gas limit for the transaction'}
                handleInvokingAPIMethod={() => handleTransferMultipleTokens(APIButton.API)}
              />
            );
          }
        })}
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="TokenCreate"
          hederaNetwork={hederaNetwork}
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

export default TransferMultipleTokens;
