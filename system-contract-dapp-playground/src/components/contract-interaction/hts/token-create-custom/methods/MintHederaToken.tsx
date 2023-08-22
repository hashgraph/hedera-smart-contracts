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
import { useEffect, useMemo, useState } from 'react';
import { Contract } from 'ethers';
import { useToast } from '@chakra-ui/react';
import {
  TransactionResult,
  handleAPIErrors,
  handleSanitizeHederaFormInputs,
} from '../shared/sharedMethods';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import {
  mintHederaToken,
  mintHederaTokenToAddress,
} from '@/api/hedera/tokenCreateCustom-interactions';
import {
  SharedExecuteButton,
  SharedFormInputField,
  SharedFromButton,
  TransactionResultTable,
} from '../shared/sharedComponents';
import { htsTokenMintParamFields } from '@/utils/contract-interactions/HTS/constant';

interface PageProps {
  baseContract: Contract;
}

const MintHederaToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const TRANSACTION_PAGE_SIZE = 10;
  const [isLoading, setIsLoading] = useState(false);
  const hederaNetwork = JSON.parse(Cookies.get('_network') as string);
  const transactionResultStorageKey = 'hedera_HTS_token-mint_results';
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [isTokenMintinguccessful, setIsTokenMintingSuccessful] = useState(false);
  const [tokenType, setTokenType] = useState<'FUNGIBLE' | 'NON_FUNGIBLE'>('FUNGIBLE');
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const tokenMintFields = useMemo(() => {
    return tokenType === 'FUNGIBLE'
      ? ['tokenAddressToMint', 'amount', 'metadata', 'recipientAddress']
      : ['tokenAddressToMint', 'metadata', 'recipientAddress'];
  }, [tokenType]);
  const [paramValues, setParamValues] = useState<any>({
    tokenAddressToMint: '',
    amount: '',
    metadata: '',
    recipientAddress: '',
  });

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

  /** @dev handle invoking the API to interact with smart contract to mint tokens */
  const handleMintTokens = async () => {
    const { tokenAddressToMint, amount, metadata, recipientAddress } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'Mint',
      tokenAddressToMint,
      amount,
      recipientAddress,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // turn is loading on
    setIsLoading(true);

    // invoke method API
    // @logic if recipientAddress is set => mintHederaTokenToAddress()
    // @logic if recipientAddress is NOT set => mintHederaToken()
    let txRes: any;
    if (recipientAddress) {
      txRes = await mintHederaTokenToAddress(
        baseContract,
        tokenType,
        tokenAddressToMint,
        recipientAddress,
        tokenType === 'FUNGIBLE' ? Number(amount) : 0,
        metadata
      );
    } else {
      txRes = await mintHederaToken(
        baseContract,
        tokenType,
        tokenAddressToMint,
        tokenType === 'FUNGIBLE' ? Number(amount) : 0,
        metadata
      );
    }

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (txRes.err) {
      handleAPIErrors(
        txRes.err,
        toaster,
        txRes.transactionHash,
        setTransactionResults,
        tokenAddressToMint
      );
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          txHash: txRes.transactionHash as string,
          tokenAddress: paramValues.tokenAddressToMint,
          status: 'sucess',
          recipientAddress,
        },
      ]);

      setIsTokenMintingSuccessful(true);
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
    if (isTokenMintinguccessful) {
      toaster({
        title: 'Non-fungible token creation successful 🎉',
        description: 'A new balance has been set for the treasury',
        status: 'success',
        position: 'top',
      });

      // reset values
      setParamValues({
        tokenAddressToMint: '',
        amount: '',
        metadata: '',
        recipientAddress: '',
      });
      setIsTokenMintingSuccessful(false);
      // set the current page to the last page so it can show the newly created transaction
      const maxPageNum = Math.ceil(transactionResults.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [isTokenMintinguccessful, toaster]);

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Mint form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* Token type */}
        <div className="w-full flex gap-3">
          {/* no custom fee */}

          <SharedFromButton
            explanation={''}
            buttonTitle={'Fungible Token'}
            handleButtonOnClick={() => setTokenType('FUNGIBLE')}
            switcher={tokenType === 'FUNGIBLE'}
          />

          {/* with custom fee */}
          <SharedFromButton
            explanation={''}
            buttonTitle={'Non-Fungible Token'}
            handleButtonOnClick={() => setTokenType('NON_FUNGIBLE')}
            switcher={tokenType === 'NON_FUNGIBLE'}
          />
        </div>

        {/* tokenAddress & amount & metadata*/}
        {tokenMintFields.map((param) => {
          return (
            <div key={(htsTokenMintParamFields as any)[param].paramKey}>
              <SharedFormInputField
                paramKey={(htsTokenMintParamFields as any)[param].paramKey}
                explanation={(htsTokenMintParamFields as any)[param].explanation}
                paramValue={paramValues[param]}
                paramType={(htsTokenMintParamFields as any)[param].inputType}
                param={param}
                paramPlaceholder={(htsTokenMintParamFields as any)[param].inputPlaceholder}
                paramSize={(htsTokenMintParamFields as any)[param].inputSize}
                paramFocusColor={(htsTokenMintParamFields as any)[param].inputFocusBorderColor}
                paramClassName={(htsTokenMintParamFields as any)[param].inputClassname}
                handleInputOnChange={handleInputOnChange}
              />
            </div>
          );
        })}

        {/* Execute button */}
        <SharedExecuteButton
          isLoading={isLoading}
          buttonTitle={`Mint ${tokenType === 'FUNGIBLE' ? 'Fungible' : 'Non-Fungible'} Token`}
          handleCreatingFungibleToken={handleMintTokens}
        />
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          hederaNetwork={hederaNetwork}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          currentTransactionPage={currentTransactionPage}
          transactionResultStorageKey={transactionResultStorageKey}
          transactionResults={transactionResults}
          paginatedTransactionResults={paginatedTransactionResults}
          setCurrentTransactionPage={setCurrentTransactionPage}
          setTransactionResults={setTransactionResults}
          withTokenAddress={true}
          withRecipientAddress={true}
        />
      )}
    </div>
  );
};

export default MintHederaToken;
