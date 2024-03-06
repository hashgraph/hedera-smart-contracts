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
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { SharedSigningKeysComponent } from '../../../shared/components/SigningKeysForm';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { htsTokenCreateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { createHederaNonFungibleToken } from '@/api/hedera/hts-interactions/tokenCreateCustom-interactions';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  SharedFormInputField,
  SharedFormButton,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';
import {
  HederaTokenKeyTypes,
  HederaTokenKeyValueType,
  TRANSACTION_PAGE_SIZE,
} from '../../../shared/states/commonStates';

interface PageProps {
  baseContract: Contract;
}

const NonFungibleTokenCreate = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [withCustomFee, setWithCustomFee] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_CREATE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-CREATE']['NON-FUNGIBLE-TOKEN'];
  const tokenCreateFields = {
    info: ['name', 'symbol', 'memo', 'maxSupply', 'treasury'],
    feeTokenAddress: 'feeTokenAddress',
  };
  const initialParamValues = {
    name: '',
    memo: '',
    symbol: '',
    treasury: '',
    feeValue: '',
    maxSupply: '',
    feeAmount: '',
    feeTokenAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  // keys states
  const [keys, setKeys] = useState<ICommonKeyObject[]>([]); // keeps track of keys array to pass to the API
  const [chosenKeys, setChosenKeys] = useState(new Set<IHederaTokenServiceKeyType>()); // keeps track of keyTypes which have already been chosen in the list
  const [keyTypesToShow, setKeyTypesToShow] = useState(new Set(HederaTokenKeyTypes)); // keeps track of the left over keyTypes to show in the drop down

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

  /** @dev handle invoking the API to interact with smart contract and create non fungible token */
  const handleCreatingNonFungibleToken = async () => {
    const { name, symbol, memo, maxSupply, treasury, feeTokenAddress, feeValue, feeAmount } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'TokenCreate',
      name,
      keys,
      symbol,
      feeValue,
      treasury,
      maxSupply,
      withCustomFee,
      feeAmount,
      feeTokenAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke createHederaFungibleToken()
    const { transactionHash, tokenAddress, err } = await createHederaNonFungibleToken(
      baseContract,
      name,
      symbol,
      memo,
      Number(maxSupply),
      treasury,
      keys,
      feeValue,
      withCustomFee ? feeTokenAddress : undefined,
      withCustomFee ? Number(feeAmount) : undefined
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err || !tokenAddress) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        sessionedContractAddress: currentContractAddress,
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_NFT_CREATE,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          tokenAddress,
          status: 'success',
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          sessionedContractAddress: currentContractAddress,
          transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_NFT_CREATE,
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
    setKeys,
    isSuccessful,
    setChosenKeys,
    setParamValues,
    setIsSuccessful,
    setWithCustomFee,
    setKeyTypesToShow,
    transactionResults,
    setCurrentTransactionPage,
    resetParamValues: initialParamValues,
    toastTitle: 'Token creation successful',
    toastDescription: 'A new balance has been set for the receiver',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Create form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* name & symbol & memo & maxSupply & treasury */}
        {tokenCreateFields.info.map((param) => {
          return (
            <div key={(htsTokenCreateParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsTokenCreateParamFields as any)[param].paramKey}
                paramSize={(htsTokenCreateParamFields as any)[param].inputSize}
                paramType={(htsTokenCreateParamFields as any)[param].inputType}
                explanation={(htsTokenCreateParamFields as any)[param].explanation}
                paramClassName={(htsTokenCreateParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsTokenCreateParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsTokenCreateParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        {/* custom fee */}
        <div className="w-full flex gap-3">
          {/* no custom fee */}
          <SharedFormButton
            switcher={!withCustomFee}
            buttonTitle={'No Custom Fee'}
            handleButtonOnClick={() => setWithCustomFee(false)}
            explanation={(htsTokenCreateParamFields as any)['customFee'].explanation.off}
          />

          {/* with custom fee */}
          <SharedFormButton
            switcher={withCustomFee}
            buttonTitle={'With Custom Fee'}
            handleButtonOnClick={() => setWithCustomFee(true)}
            explanation={(htsTokenCreateParamFields as any)['customFee'].explanation.on}
          />
        </div>

        {/* fee token address */}
        {withCustomFee && (
          <>
            <SharedFormInputField
              param={'feeTokenAddress'}
              handleInputOnChange={handleInputOnChange}
              paramValue={paramValues['feeTokenAddress']}
              paramKey={(htsTokenCreateParamFields as any)['feeTokenAddress'].paramKey}
              paramType={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputType}
              paramSize={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputSize}
              explanation={(htsTokenCreateParamFields as any)['feeTokenAddress'].explanation}
              paramClassName={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputClassname}
              paramPlaceholder={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputPlaceholder}
              paramFocusColor={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputFocusBorderColor}
            />

            <SharedFormInputField
              param={'feeAmount'}
              handleInputOnChange={handleInputOnChange}
              paramValue={paramValues['feeAmount']}
              paramKey={(htsTokenCreateParamFields as any)['feeAmount'].paramKey}
              paramType={(htsTokenCreateParamFields as any)['feeAmount'].inputType}
              paramSize={(htsTokenCreateParamFields as any)['feeAmount'].inputSize}
              explanation={(htsTokenCreateParamFields as any)['feeAmount'].explanation}
              paramClassName={(htsTokenCreateParamFields as any)['feeAmount'].inputClassname}
              paramPlaceholder={(htsTokenCreateParamFields as any)['feeAmount'].inputPlaceholder}
              paramFocusColor={(htsTokenCreateParamFields as any)['feeAmount'].inputFocusBorderColor}
            />
          </>
        )}

        {/* keys */}
        <SharedSigningKeysComponent
          keys={keys}
          setKeys={setKeys}
          chosenKeys={chosenKeys}
          setChosenKeys={setChosenKeys}
          keyTypesToShow={keyTypesToShow}
          setKeyTypesToShow={setKeyTypesToShow}
          HederaTokenKeyTypes={HederaTokenKeyTypes}
          buttonTitle="Add signing keys to the token"
          HederaTokenKeyValueType={HederaTokenKeyValueType}
        />

        {/* Service Fee & Execute button */}
        <SharedExecuteButtonWithFee
          isLoading={isLoading}
          feeType={'SERVICE'}
          paramValues={paramValues.feeValue}
          placeHolder={'Service fee...'}
          executeBtnTitle={'Create Non Fungible Token'}
          handleInputOnChange={handleInputOnChange}
          explanation={
            'Represents the fee in HBAR directly paid to the contract system of the Hedera Token Service'
          }
          handleInvokingAPIMethod={handleCreatingNonFungibleToken}
        />
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

export default NonFungibleTokenCreate;
