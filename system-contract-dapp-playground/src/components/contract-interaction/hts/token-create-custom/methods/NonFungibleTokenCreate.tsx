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
import { handleAPIErrors } from '../../shared/methods/handleAPIErrors';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { SharedSigningKeysComponent } from '../../shared/components/SigningKeysForm';
import { TransactionResultTable } from '../../shared/components/TransactionResultTable';
import { createHederaNonFungibleToken } from '@/api/hedera/tokenCreateCustom-interactions';
import { handleSanitizeHederaFormInputs } from '../../shared/methods/handleSanitizeFormInputs';
import { htsTokenCreateParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import {
  SharedFormInputField,
  SharedFormButton,
  SharedExecuteButtonWithServiceFee,
} from '../../shared/components/ParamInputForm';
import {
  TransactionResult,
  IHederaTokenServiceKeyType,
  IHederaTokenServiceKeyValueType,
  CommonKeyObject,
} from '@/types/contract-interactions/HTS';

interface PageProps {
  baseContract: Contract;
}

const NonFungibleTokenCreate = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const TRANSACTION_PAGE_SIZE = 10;
  const [isLoading, setIsLoading] = useState(false);
  const [withCustomFee, setWithCustomFee] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const transactionResultStorageKey = 'hedera_HTS_nft-creation_results';
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [isCreatingNFTSuccessful, setIsCreatingNFTSuccessful] = useState(false);
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const tokenCreateFields = {
    info: ['name', 'symbol', 'memo', 'maxSupply', 'treasury'],
    feeTokenAddress: 'feeTokenAddress',
  };
  const [paramValues, setParamValues] = useState<any>({
    name: '',
    memo: '',
    symbol: '',
    treasury: '',
    msgValue: '',
    maxSupply: '',
    feeTokenAddress: '',
  });

  // keys states
  const HederaTokenKeyTypes: IHederaTokenServiceKeyType[] = useMemo(
    () => ['ADMIN', 'KYC', 'FREEZE', 'WIPE', 'SUPPLY', 'FEE', 'PAUSE'],
    []
  );
  const HederaTokenKeyValueType: IHederaTokenServiceKeyValueType[] = [
    'inheritAccountKey',
    'contractId',
    'ed25519',
    'ECDSA_secp256k1',
    'delegatableContractId',
  ];
  const [keys, setKeys] = useState<CommonKeyObject[]>([]); // keeps track of keys array to pass to the API
  const [chosenKeys, setChosenKeys] = useState(new Set<IHederaTokenServiceKeyType>()); // keeps track of keyTypes which have already been chosen in the list
  const [keyTypesToShow, setKeyTypesToShow] = useState(new Set(HederaTokenKeyTypes)); // keeps track of the left over keyTypes to show in the drop down

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    const { storageResult, err: storagedErr } = getArrayTypedValuesFromLocalStorage(
      transactionResultStorageKey
    );
    // handle err
    if (storagedErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve transaction results from local storage',
        description: "See client's console for more information",
      });
      return;
    }

    // update states if storageResult is found
    if (storageResult) {
      setTransactionResults(storageResult as TransactionResult[]);

      // set the current page to the last page so it can show the latest transactions
      const maxPageNum = Math.ceil(storageResult.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [toaster]);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = useMemo(() => {
    const startIndex = (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE;
    const endIndex = (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE + TRANSACTION_PAGE_SIZE;
    return transactionResults.slice(startIndex, endIndex);
  }, [currentTransactionPage, transactionResults]);

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string) => {
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle invoking the API to interact with smart contract and create non fungible token */
  const handleCreatingNonFungibleToken = async () => {
    const { name, symbol, memo, maxSupply, treasury, feeTokenAddress, msgValue } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'TokenCreate',
      name,
      keys,
      symbol,
      msgValue,
      treasury,
      maxSupply,
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
    const { transactionHash, tokenAddress, err } = await createHederaNonFungibleToken(
      baseContract,
      name,
      symbol,
      memo,
      Number(maxSupply),
      treasury,
      keys,
      msgValue,
      withCustomFee ? feeTokenAddress : undefined
    );

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (err || !tokenAddress) {
      handleAPIErrors({ err, toaster, transactionHash, setTransactionResults });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          tokenAddress,
          status: 'sucess',
          txHash: transactionHash as string,
        },
      ]);

      setIsCreatingNFTSuccessful(true);
    }
  };

  // @dev listen to change event on transactionResults state => load to localStorage
  useEffect(() => {
    if (transactionResults.length > 0) {
      localStorage.setItem(transactionResultStorageKey, JSON.stringify(transactionResults));
    }
  }, [transactionResults]);

  // toast successful
  useEffect(() => {
    if (isCreatingNFTSuccessful) {
      toaster({
        title: '🎉 Non-fungible token creation successful 🎉',
        description: 'A new balance has been set for the treasury',
        status: 'success',
        position: 'top',
      });

      // reset values
      setParamValues({
        memo: '',
        name: '',
        symbol: '',
        treasury: '',
        msgValue: '',
        maxSupply: '',
        feeTokenAddress: '',
      });
      setIsCreatingNFTSuccessful(false);
      setKeyTypesToShow(new Set(HederaTokenKeyTypes));
      setChosenKeys(new Set<IHederaTokenServiceKeyType>());
      setKeys([]);
      setWithCustomFee(false);
      // set the current page to the last page so it can show the newly created transaction
      const maxPageNum = Math.ceil(transactionResults.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [isCreatingNFTSuccessful, toaster, transactionResults.length, HederaTokenKeyTypes]);

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
          <SharedFormInputField
            param={'feeTokenAddress'}
            handleInputOnChange={handleInputOnChange}
            paramValue={paramValues['feeTokenAddress']}
            paramKey={(htsTokenCreateParamFields as any)['feeTokenAddress'].paramKey}
            paramType={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputType}
            paramSize={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputSize}
            explanation={(htsTokenCreateParamFields as any)['feeTokenAddress'].explanation}
            paramClassName={(htsTokenCreateParamFields as any)['feeTokenAddress'].inputClassname}
            paramPlaceholder={
              (htsTokenCreateParamFields as any)['feeTokenAddress'].inputPlaceholder
            }
            paramFocusColor={
              (htsTokenCreateParamFields as any)['feeTokenAddress'].inputFocusBorderColor
            }
          />
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
          HederaTokenKeyValueType={HederaTokenKeyValueType}
        />

        {/* Service Fee & Execute button */}
        <SharedExecuteButtonWithServiceFee
          isLoading={isLoading}
          paramValues={paramValues['msgValue']}
          handleInputOnChange={handleInputOnChange}
          executeBtnTitle={'Create Non-Fungible Token'}
          handleCreatingFungibleToken={handleCreatingNonFungibleToken}
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
          transactionResultStorageKey={transactionResultStorageKey}
          paginatedTransactionResults={paginatedTransactionResults}
          setCurrentTransactionPage={setCurrentTransactionPage}
        />
      )}
    </div>
  );
};

export default NonFungibleTokenCreate;
