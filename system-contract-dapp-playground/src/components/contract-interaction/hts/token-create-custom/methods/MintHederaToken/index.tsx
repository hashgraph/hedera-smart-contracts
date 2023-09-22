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
import { generatedRandomUniqueKey } from '@/utils/common/helpers';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import MetadataInputForm from '../../../shared/components/MetadataInputForm';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { CONTRACT_NAMES, HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { htsTokenMintParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  SharedFormButton,
  SharedExecuteButton,
  SharedFormInputField,
} from '../../../shared/components/ParamInputForm';
import {
  mintHederaToken,
  mintHederaTokenToAddress,
} from '@/api/hedera/hts-interactions/tokenCreateCustom-interactions';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'FUNGIBLE' | 'NON_FUNGIBLE';

const MintHederaToken = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('FUNGIBLE');
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_CREATE) as string;
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const [metadata, setMetadata] = useState<{ metaKey: string; metaValue: string }[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-CREATE']['MINT-TOKEN'];
  const tokenMintFields = useMemo(() => {
    return APIMethods === 'FUNGIBLE'
      ? ['tokenAddressToMint', 'amount', 'recipientAddress']
      : ['tokenAddressToMint', 'recipientAddress'];
  }, [APIMethods]);
  const initialParamValues = {
    amount: '',
    recipientAddress: '',
    tokenAddressToMint: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: string }[] = [
    {
      API: 'FUNGIBLE',
      apiSwitchTitle: 'Fungible Token',
      executeTitle: 'Mint Fungible Token',
    },
    {
      API: 'NON_FUNGIBLE',
      apiSwitchTitle: 'Non-Fungible Token',
      executeTitle: 'Mint Non-Fungible Token',
    },
  ];

  /** @dev retrieve token creation results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      setCurrentTransactionPage,
      setTransactionResults
    );
  }, [toaster, transactionResultStorageKey]);

  /** @dev declare a paginatedTransactionResults */
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);

  /** @dev handle form inputs on change */
  const handleInputOnChange = (e: any, param: string, metaKey?: string) => {
    if (param === 'metadata') {
      setMetadata((prev) =>
        prev.map((meta) => {
          if (meta.metaKey === metaKey) {
            meta.metaValue = e.target.value;
          }
          return meta;
        })
      );
    }
    setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
  };

  /** @dev handle adding metadata */
  const handleAddMetadata = (type: 'ADD' | 'REMOVE', removingMetaKey?: string) => {
    switch (type) {
      case 'ADD':
        setMetadata((prev) => [...prev, { metaKey: generatedRandomUniqueKey(9), metaValue: '' }]);
        break;
      case 'REMOVE':
        setMetadata((prev) => prev.filter((meta) => meta.metaKey !== removingMetaKey));
    }
  };

  /** @dev handle invoking the API to interact with smart contract to mint tokens */
  const handleMintTokens = async () => {
    const { tokenAddressToMint, amount, recipientAddress } = paramValues;

    // sanitize params
    const sanitizeErr = handleSanitizeHederaFormInputs({
      API: 'Mint',
      amount,
      recipientAddress,
      tokenAddressToMint,
    });

    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // prepare an array of metadata for the API
    const metadatas = metadata.map((meta) => meta.metaValue);

    // turn is loading on
    setIsLoading(true);

    // invoke method API
    // @logic if recipientAddress is set => mintHederaTokenToAddress()
    // @logic if recipientAddress is NOT set => mintHederaToken()
    let txRes: any;
    if (recipientAddress) {
      txRes = await mintHederaTokenToAddress(
        baseContract,
        APIMethods,
        tokenAddressToMint,
        recipientAddress,
        APIMethods === 'FUNGIBLE' ? Number(amount) : 0,
        metadatas
      );
    } else {
      txRes = await mintHederaToken(
        baseContract,
        APIMethods,
        tokenAddressToMint,
        APIMethods === 'FUNGIBLE' ? Number(amount) : 0,
        metadatas
      );
    }

    // turn is loading off
    setIsLoading(false);

    // handle err
    if (txRes.err) {
      handleAPIErrors({
        toaster,
        err: txRes.err,
        setTransactionResults,
        tokenAddress: tokenAddressToMint,
        transactionHash: txRes.transactionHash,
        sessionedContractAddress: currentContractAddress,
        transactionType: `HTS-${APIMethods === 'FUNGIBLE' ? 'TOKEN' : 'NFT'}-MINT`,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          accountAddress: recipientAddress,
          transactionTimeStamp: Date.now(),
          txHash: txRes.transactionHash as string,
          tokenAddress: paramValues.tokenAddressToMint,
          sessionedContractAddress: currentContractAddress,
          transactionType: `HTS-${APIMethods === 'FUNGIBLE' ? 'TOKEN' : 'NFT'}-MINT`,
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
    setMetadata,
    isSuccessful,
    setParamValues,
    setIsSuccessful,
    transactionResults,
    setCurrentTransactionPage,
    resetParamValues: initialParamValues,
    toastTitle: 'Token creation successful',
    toastDescription: 'A new balance has been set for the receiver',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Token Mint form */}
      <div className="w-[600px]/ flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* API methods */}
        <div className="w-full flex gap-3">
          {APIButtonTitles.map((APIButton) => {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedFormButton
                  switcher={APIMethods === APIButton.API}
                  buttonTitle={APIButton.apiSwitchTitle}
                  handleButtonOnClick={() => setAPIMethods(APIButton.API)}
                  explanation={''}
                />
              </div>
            );
          })}
        </div>

        {/* tokenAddress & amount & recipientAddress*/}
        {tokenMintFields.map((param) => {
          return (
            <div key={(htsTokenMintParamFields as any)[param].paramKey}>
              <SharedFormInputField
                param={param}
                paramValue={paramValues[param]}
                handleInputOnChange={handleInputOnChange}
                paramKey={(htsTokenMintParamFields as any)[param].paramKey}
                paramType={(htsTokenMintParamFields as any)[param].inputType}
                paramSize={(htsTokenMintParamFields as any)[param].inputSize}
                explanation={(htsTokenMintParamFields as any)[param].explanation}
                paramClassName={(htsTokenMintParamFields as any)[param].inputClassname}
                paramPlaceholder={(htsTokenMintParamFields as any)[param].inputPlaceholder}
                paramFocusColor={(htsTokenMintParamFields as any)[param].inputFocusBorderColor}
              />
            </div>
          );
        })}

        {/* Metadata */}
        {APIMethods === 'NON_FUNGIBLE' && (
          <MetadataInputForm
            metadata={metadata}
            handleAddMetadata={handleAddMetadata}
            handleInputOnChange={handleInputOnChange}
          />
        )}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedExecuteButton
                  isLoading={isLoading}
                  handleCreatingFungibleToken={() => handleMintTokens()}
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
          API="TokenMint"
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

export default MintHederaToken;
