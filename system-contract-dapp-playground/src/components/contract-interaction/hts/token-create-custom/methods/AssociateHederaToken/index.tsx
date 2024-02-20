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
import { useState, useEffect } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import TokenAddressesInputForm from '../../../shared/components/TokenAddressesInputForm';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { SharedFormInputField, SharedExecuteButtonWithFee } from '../../../shared/components/ParamInputForm';
import { htsTokenAssociateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { associateHederaTokensToAccounts } from '@/api/hedera/hts-interactions/tokenCreateCustom-interactions';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';

interface PageProps {
  baseContract: Contract;
}

const AssociateHederaToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const initialParamValues = { associatingAddress: '', feeValue: '' };
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [paramValues, setParamValues] = useState<any>(initialParamValues);
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_CREATE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const initialTokenAddressesValues = { fieldKey: generatedRandomUniqueKey(9), fieldValue: '' };
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-CREATE']['ASSOCIATE-TOKEN'];
  const [hederaTokenAddresses, setHederaTokenAddresses] = useState<
    { fieldKey: string; fieldValue: string }[]
  >([initialTokenAddressesValues]);

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
  const handleInputOnChange = (e: any, param: string, fieldKey?: string) => {
    if (param === 'tokenAddresses') {
      setHederaTokenAddresses((prev) =>
        prev.map((field) => {
          if (field.fieldKey === fieldKey) {
            field.fieldValue = e.target.value;
          }
          return field;
        })
      );
    }
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle adding metadata */
  const handleModifyTokenAddresses = (type: 'ADD' | 'REMOVE', removingFieldKey?: string) => {
    switch (type) {
      case 'ADD':
        setHederaTokenAddresses((prev) => [
          ...prev,
          { fieldKey: generatedRandomUniqueKey(9), fieldValue: '' },
        ]);
        break;
      case 'REMOVE':
        if (hederaTokenAddresses.length > 1) {
          setHederaTokenAddresses((prev) => prev.filter((field) => field.fieldKey !== removingFieldKey));
        }
    }
  };

  /** @dev handle invoking the API to interact with smart contract to associate tokens */
  const handleAssociateTokens = async () => {
    const { associatingAddress } = paramValues;

    // convert hederaTokenAddresses into a string[]
    const tokenAddresses = hederaTokenAddresses.map((field) => field.fieldValue.trim());

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'Associate',
      tokenAddresses,
      associatingAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke method API
    const { transactionHash, err } = await associateHederaTokensToAccounts(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      tokenAddresses,
      associatingAddress,
      Number(paramValues.feeValue)
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        tokenAddresses,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        accountAddress: associatingAddress,
        sessionedContractAddress: currentContractAddress,
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_ASSOCIATE,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          tokenAddresses,
          status: 'success',
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          accountAddress: associatingAddress,
          sessionedContractAddress: currentContractAddress,
          transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_TOKEN_ASSOCIATE,
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
    initialTokenAddressesValues,
    resetParamValues: initialParamValues,
    toastTitle: 'Token association successful',
    setTokenAddresses: setHederaTokenAddresses,
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Association form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* associatingAccount*/}
        <SharedFormInputField
          param={'associatingAddress'}
          paramValue={paramValues['associatingAddress']}
          handleInputOnChange={handleInputOnChange}
          paramKey={(htsTokenAssociateParamFields as any)['associatingAddress'].paramKey}
          paramType={(htsTokenAssociateParamFields as any)['associatingAddress'].inputType}
          paramSize={(htsTokenAssociateParamFields as any)['associatingAddress'].inputSize}
          explanation={(htsTokenAssociateParamFields as any)['associatingAddress'].explanation}
          paramClassName={(htsTokenAssociateParamFields as any)['associatingAddress'].inputClassname}
          paramPlaceholder={(htsTokenAssociateParamFields as any)['associatingAddress'].inputPlaceholder}
          paramFocusColor={(htsTokenAssociateParamFields as any)['associatingAddress'].inputFocusBorderColor}
        />

        {/* Token addresses */}
        <TokenAddressesInputForm
          tokenAddresses={hederaTokenAddresses}
          handleInputOnChange={handleInputOnChange}
          handleModifyTokenAddresses={handleModifyTokenAddresses}
        />

        {/* Execute button */}
        <SharedExecuteButtonWithFee
          isLoading={isLoading}
          feeType={'GAS'}
          paramValues={paramValues.feeValue}
          placeHolder={'Gas limit...'}
          executeBtnTitle={'Associate Tokens'}
          handleInputOnChange={handleInputOnChange}
          explanation={'Optional gas limit for the transaction.'}
          handleInvokingAPIMethod={() => handleAssociateTokens()}
        />
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="TokenAssociate"
          hederaNetwork={HEDERA_NETWORK}
          transactionResults={transactionResults}
          setTransactionResults={setTransactionResults}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      )}
    </div>
  );
};

export default AssociateHederaToken;
