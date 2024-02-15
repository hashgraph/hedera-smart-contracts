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
import { isAddress } from 'ethers';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { getWalletProvider } from '@/api/wallet';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { handleIHRC719APIs } from '@/api/hedera/ihrc-interactions';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { handleAPIErrors } from '../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../hooks/useToastSuccessful';
import { TRANSACTION_PAGE_SIZE } from '../../hts/shared/states/commonStates';
import { usePaginatedTxResults } from '../../../../hooks/usePaginatedTxResults';
import { TransactionResultTable } from '../../../common/components/TransactionResultTable';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../hooks/useUpdateLocalStorage';
import { SharedExecuteButton, SharedFormInputField } from '../../hts/shared/components/ParamInputForm';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
  HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
} from '@/utils/common/constants';

interface PageProps {
  network: string;
}

type API_NAMES = 'ASSOCIATE' | 'DISSOCIATE';

const HederaIHRC719Methods = ({ network }: PageProps) => {
  // general states
  const hederaNetwork = Cookies.get('_network');
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState({
    ASSOCIATE: false,
    DISSOCIATE: false,
  });
  const [isSuccessful, setIsSuccessful] = useState(false);
  const initialParamValues = { hederaTokenAddress: '', feeValue: '' };
  const [paramValues, setParamValues] = useState(initialParamValues);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const parsedHederaNetworkL = hederaNetwork && JSON.parse(hederaNetwork);
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['IHRC719-RESULTS'];

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

  /** @dev handle invoking the API to interact with IHR719C contract*/
  const handleExecuteIHRC719APIs = async (API: API_NAMES) => {
    // sanitize params
    let sanitizeErr;
    if (!isAddress(paramValues.hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    }

    if (sanitizeErr) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: sanitizeErr,
      });
      return;
    }

    // prepare wallet signer
    const walletProvider = getWalletProvider();
    const walletSigner = await walletProvider!.walletProvider!.getSigner();

    // turn isLoading on
    setIsLoading((prev) => ({ ...prev, [API]: true }));

    // invoke method APIS
    const { transactionHash, err } = await handleIHRC719APIs(
      API,
      paramValues.hederaTokenAddress,
      walletSigner,
      Number(paramValues.feeValue),
      parsedHederaNetworkL
    );

    // turn isLoading off
    setIsLoading((prev) => ({ ...prev, [API]: false }));

    // handle err
    if (err) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        sessionedContractAddress: '',
        transactionResultStorageKey,
        tokenAddress: paramValues.hederaTokenAddress,
        transactionType:
          API === 'ASSOCIATE'
            ? HEDERA_COMMON_TRANSACTION_TYPE.IHRC719_ASSOCIATE
            : HEDERA_COMMON_TRANSACTION_TYPE.IHRC719_DISSOCIATE,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          transactionResultStorageKey,
          sessionedContractAddress: '',
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          tokenAddress: paramValues.hederaTokenAddress,
          transactionType:
            API === 'ASSOCIATE'
              ? HEDERA_COMMON_TRANSACTION_TYPE.IHRC719_ASSOCIATE
              : HEDERA_COMMON_TRANSACTION_TYPE.IHRC719_DISSOCIATE,
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
    <div className="w-full mx-3 flex justify-center flex-col gap-20 -mt-6">
      {/* Update token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* Hedera token address */}
        <SharedFormInputField
          paramType={'text'}
          param={'hederaTokenAddress'}
          paramKey={'hederaTokenAddress'}
          paramPlaceholder={'Token address...'}
          handleInputOnChange={handleInputOnChange}
          explanation={`represents the Hedera Token`}
          paramValue={paramValues['hederaTokenAddress']}
          paramFocusColor={HEDERA_BRANDING_COLORS.purple}
          paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
          paramClassName={HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME}
        />

        {/* Execute button */}
        <div className="flex gap-9">
          <SharedExecuteButton
            isLoading={isLoading.ASSOCIATE}
            handleCreatingFungibleToken={() => handleExecuteIHRC719APIs('ASSOCIATE')}
            buttonTitle={'Associate Token'}
          />
          <SharedFormInputField
            param={'feeValue'}
            paramValue={paramValues.feeValue}
            handleInputOnChange={handleInputOnChange}
            paramSize={HEDERA_CHAKRA_INPUT_BOX_SIZES.large}
            paramType={'number'}
            paramKey={'feeValue'}
            explanation={'Optional gas limit for the transaction.'}
            paramClassName={'border-white/30 rounded-xl'}
            paramPlaceholder={'Gas limit...'}
            paramFocusColor={HEDERA_BRANDING_COLORS.purple}
          />
          <SharedExecuteButton
            isLoading={isLoading.DISSOCIATE}
            handleCreatingFungibleToken={() => handleExecuteIHRC719APIs('DISSOCIATE')}
            buttonTitle={'Dissociate Token'}
          />
        </div>
      </div>

      {/* transaction results table */}
      {transactionResults.length > 0 && (
        <TransactionResultTable
          API="TokenCreate"
          hederaNetwork={network}
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

export default HederaIHRC719Methods;
