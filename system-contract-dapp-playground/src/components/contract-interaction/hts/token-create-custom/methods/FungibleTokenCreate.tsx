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
import { handleAPIErrors } from '../../shared/methods/handleAPIErrors';
import { useToastSuccessful } from '../../shared/hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../shared/hooks/usePaginatedTxResults';
import { HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { SharedSigningKeysComponent } from '../../shared/components/SigningKeysForm';
import { createHederaFungibleToken } from '@/api/hedera/hts-interactions/tokenCreateCustom-interactions';
import { TransactionResultTable } from '../../shared/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../shared/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../shared/hooks/useUpdateLocalStorage';
import { htsTokenCreateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../shared/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  SharedFormInputField,
  SharedFormButton,
  SharedExecuteButtonWithFee,
} from '../../shared/components/ParamInputForm';
import {
  CommonKeyObject,
  IHederaTokenServiceKeyType,
  TransactionResult,
} from '@/types/contract-interactions/HTS';
import {
  HederaTokenKeyTypes,
  HederaTokenKeyValueType,
  TRANSACTION_PAGE_SIZE,
} from '../../shared/states/commonStates';

interface PageProps {
  baseContract: Contract;
}

const FungibleTokenCreate = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [withCustomFee, setWithCustomFee] = useState(false);
  const [isDefaultFreeze, setIsDefaultFreeze] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-CREATE']['FUNGIBLE-TOKEN'];
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const tokenCreateFields = {
    info: ['name', 'symbol', 'memo'],
    supply: ['initSupply', 'maxSupply', 'decimals'],
    treasury: 'treasury',
    feeTokenAddress: 'feeTokenAddress',
  };
  const initialParamValues = {
    memo: '',
    name: '',
    symbol: '',
    feeValue: '',
    treasury: '',
    decimals: '',
    maxSupply: '',
    initSupply: '',
    feeTokenAddress: '',
    freezeStatus: false,
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  // Keys states
  const [keys, setKeys] = useState<CommonKeyObject[]>([]); // keeps track of keys array to pass to the API
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
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResults);

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string) => {
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract and create fungible token */
  const handleCreatingFungibleToken = async () => {
    const {
      memo,
      name,
      symbol,
      treasury,
      feeValue,
      decimals,
      maxSupply,
      initSupply,
      freezeStatus,
      feeTokenAddress,
    } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'TokenCreate',
      name,
      keys,
      symbol,
      feeValue,
      decimals,
      treasury,
      maxSupply,
      initSupply,
      withCustomFee,
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
    const { transactionHash, tokenAddress, err } = await createHederaFungibleToken(
      baseContract,
      name,
      symbol,
      memo,
      Number(initSupply),
      Number(maxSupply),
      Number(decimals),
      freezeStatus,
      treasury,
      keys,
      feeValue,
      withCustomFee ? feeTokenAddress : undefined
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
        transactionType: 'HTS-TOKEN-CREATE',
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          tokenAddress,
          status: 'success',
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          transactionType: 'HTS-TOKEN-CREATE',
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
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* name & symbol & memo*/}
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

        {/* freeze status */}
        <div className="w-full flex gap-3">
          {/* false */}
          <SharedFormButton
            switcher={!isDefaultFreeze}
            buttonTitle={'Freeze Status - false'}
            explanation={(htsTokenCreateParamFields as any)['freezeStatus'].explanation.off}
            handleButtonOnClick={() => {
              setIsDefaultFreeze(false);
              setParamValues((prev: any) => ({ ...prev, isDefaultFreeze: false }));
            }}
          />

          {/* with custom fee */}
          <SharedFormButton
            switcher={isDefaultFreeze}
            buttonTitle={'Freeze Status - true'}
            explanation={(htsTokenCreateParamFields as any)['freezeStatus'].explanation.on}
            handleButtonOnClick={() => {
              setIsDefaultFreeze(true);
              setParamValues((prev: any) => ({ ...prev, isDefaultFreeze: true }));
            }}
          />
        </div>

        {/* supply & decimals */}
        <div className="flex gap-3">
          {/* initSupply & maxSupply & Decimals*/}
          {tokenCreateFields.supply.map((param) => {
            return (
              <div className="w-full" key={(htsTokenCreateParamFields as any)[param].paramKey}>
                <SharedFormInputField
                  param={param}
                  paramValue={paramValues[param]}
                  handleInputOnChange={handleInputOnChange}
                  paramKey={(htsTokenCreateParamFields as any)[param].paramKey}
                  paramType={(htsTokenCreateParamFields as any)[param].inputType}
                  paramSize={(htsTokenCreateParamFields as any)[param].inputSize}
                  explanation={(htsTokenCreateParamFields as any)[param].explanation}
                  paramClassName={(htsTokenCreateParamFields as any)[param].inputClassname}
                  paramPlaceholder={(htsTokenCreateParamFields as any)[param].inputPlaceholder}
                  paramFocusColor={(htsTokenCreateParamFields as any)[param].inputFocusBorderColor}
                />
              </div>
            );
          })}
        </div>

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
        )}

        {/* treasury */}
        <SharedFormInputField
          param={'treasury'}
          paramValue={paramValues['treasury']}
          handleInputOnChange={handleInputOnChange}
          paramSize={(htsTokenCreateParamFields as any)['treasury'].inputSize}
          paramType={(htsTokenCreateParamFields as any)['treasury'].inputType}
          paramKey={(htsTokenCreateParamFields as any)['treasury'].explanation}
          explanation={(htsTokenCreateParamFields as any)['treasury'].explanation}
          paramClassName={(htsTokenCreateParamFields as any)['treasury'].inputClassname}
          paramPlaceholder={(htsTokenCreateParamFields as any)['treasury'].inputPlaceholder}
          paramFocusColor={(htsTokenCreateParamFields as any)['treasury'].inputFocusBorderColor}
        />

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
          executeBtnTitle={'Create Fungible Token'}
          handleInputOnChange={handleInputOnChange}
          explanation={'Represents the transaction fee paid in HBAR'}
          handleInvokingAPIMethod={handleCreatingFungibleToken}
        />
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

export default FungibleTokenCreate;
