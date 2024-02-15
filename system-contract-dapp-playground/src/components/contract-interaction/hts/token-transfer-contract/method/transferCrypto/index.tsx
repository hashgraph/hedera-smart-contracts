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
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import TokenTransferForm from './TokenTransferForm';
import CryptoTransferForm from './CryptoTransferForm';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { SharedExecuteButtonWithFee } from '../../../shared/components/ParamInputForm';
import { transferCrypto } from '@/api/hedera/hts-interactions/tokenTransfer-interactions';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import { prepareCryptoTransferList, prepareTokenTransferList } from './helpers/prepareCryptoTransferValues';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  TokenTransferParam,
  CryptoTransferParam,
  generateInitialTokenTransferParamValues,
} from './helpers/generateInitialValues';

interface PageProps {
  baseContract: Contract;
}

const CryptoTransfer = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [gasLimit, setGasLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const contractCaller = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_TRANSFER) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const [tokenTransferParamValues, setTokenTransferParamValues] = useState<TokenTransferParam[]>([]);
  const [cryptoTransferParamValues, setCryptoTransferParamValues] = useState<CryptoTransferParam[]>([]);
  const transactionResultStorageKey =
    HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-TRANSFER']['CRYPTO-TRANSFER'];
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
  const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResults);

  /** @dev handle form inputs on change for tokenTransferParamValue */
  const handleTokenTransferInputOnChange = (
    e: any,
    masterFieldKey: string,
    fieldKey: string,
    transfersType: 'transfers' | 'nftTransfers',
    param:
      | 'accountID'
      | 'amount'
      | 'isApprovalA'
      | 'senderAccountID'
      | 'receiverAccountID'
      | 'serialNumber'
      | 'isApprovalB'
  ) => {
    setTokenTransferParamValues((prev) =>
      prev.map((masterParam) => {
        if (masterParam.fieldKey === masterFieldKey) {
          (masterParam.fieldValue as any)[transfersType] = (masterParam.fieldValue as any)[transfersType].map(
            (transfer: any) => {
              if (transfer.fieldKey === fieldKey) {
                const value = e.target.value;
                if (param === 'isApprovalA' || param === 'isApprovalB') {
                  if (value === '') {
                    (transfer.fieldValue as any)[param] = false;
                  } else {
                    (transfer.fieldValue as any)[param] = JSON.parse(value);
                  }
                } else {
                  (transfer.fieldValue as any)[param] = e.target.value;
                }
              }
              return transfer;
            }
          );
        }
        return masterParam;
      })
    );
  };

  /** @dev handle crypto transfer inputs on change */
  const handleCryptoTransferInputOnChange = (
    e: any,
    param:
      | 'accountID'
      | 'amount'
      | 'isApprovalA'
      | 'senderAccountID'
      | 'receiverAccountID'
      | 'serialNumber'
      | 'isApprovalB',
    fieldKey?: string,
    setFieldKey?: any
  ) => {
    const value = e.target.value;
    setFieldKey((prev: any) =>
      prev.map((field: any) => {
        if (field.fieldKey === fieldKey) {
          if (param === 'isApprovalA' || param === 'isApprovalB') {
            if (value === '') {
              field.fieldValue[param] = false;
            } else {
              field.fieldValue[param] = JSON.parse(e.target.value);
            }
          } else {
            field.fieldValue[param] = value;
          }
        }
        return field;
      })
    );
  };

  /** @dev handle modifying transfer records */
  const handleModifyTransferRecords = (
    transferType: 'TOKEN' | 'CRYPTO',
    type: 'ADD' | 'REMOVE',
    setFieldKey: any,
    removingFieldKey?: string,
    initialParamValues?: any,
    transferListType?: 'transfers' | 'nftTransfers',
    masterFieldKey?: string
  ) => {
    switch (type) {
      case 'ADD':
        if (transferType === 'CRYPTO') {
          setFieldKey((prev: any) => [...prev, initialParamValues]);
        } else {
          setFieldKey((prev: any) =>
            prev.map((masterParam: any) => {
              if (masterParam.fieldKey === masterFieldKey) {
                masterParam.fieldValue[transferListType!].push(initialParamValues);
              }
              return masterParam;
            })
          );
        }
        break;
      case 'REMOVE':
        if (transferType === 'CRYPTO') {
          setFieldKey((prev: any) => prev.filter((field: any) => field.fieldKey !== removingFieldKey));
        } else {
          setTokenTransferParamValues((prev) =>
            prev.map((masterParam) => {
              if (masterParam.fieldKey === masterFieldKey) {
                (masterParam.fieldValue as any)[transferListType!] = (masterParam.fieldValue as any)[
                  transferListType!
                ].filter((field: any) => field.fieldKey !== removingFieldKey);
              }
              return masterParam;
            })
          );
        }
    }
  };

  /**
   * @dev handle modify master token transfer record
   */
  const handleModifyMasterTokenTransferRecords = (type: 'ADD' | 'REMOVE', removingFieldKey?: string) => {
    switch (type) {
      case 'ADD':
        setTokenTransferParamValues((prev) => [...prev, generateInitialTokenTransferParamValues()]);
        break;
      case 'REMOVE':
        setTokenTransferParamValues((prev) => prev.filter((field) => field.fieldKey !== removingFieldKey));
        break;
    }
  };

  /** @dev handle invoking the API to interact with smart contract and transfer cryptos */
  const handleTransferCrypto = async () => {
    let transferList: IHederaTokenServiceTransferList = { transfers: [] };
    let tokenTransferList: IHederaTokenServiceTokenTransferList[] = [];

    // prepare crypto transfer values
    if (cryptoTransferParamValues.length > 0) {
      transferList = prepareCryptoTransferList({ contractCaller, cryptoTransferParamValues });
    }

    // prepare token transfer values
    if (tokenTransferParamValues.length > 0) {
      tokenTransferList = prepareTokenTransferList({ tokenTransferParamValues, contractCaller });
    }

    // turn on isLoading
    setIsLoading(true);

    // invoke transferCrypto()
    const { result, transactionHash, err } = await transferCrypto(
      baseContract,
      contractCaller,
      HEDERA_NETWORK,
      transferList,
      tokenTransferList,
      Number(gasLimit)
    );

    // turn off isLoading
    setIsLoading(false);

    // handle err
    if (err || !result) {
      handleAPIErrors({
        err,
        toaster,
        transactionHash,
        setTransactionResults,
        transactionResultStorageKey,
        sessionedContractAddress: currentContractAddress,
        transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_CRYPTO_TRANSFER,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          transactionResultStorageKey,
          transactionTimeStamp: Date.now(),
          txHash: transactionHash as string,
          sessionedContractAddress: currentContractAddress,
          transactionType: HEDERA_COMMON_TRANSACTION_TYPE.HTS_CRYPTO_TRANSFER,
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
    setCurrentTransactionPage,
    setTokenTransferParamValues,
    setCryptoTransferParamValues,
    toastTitle: 'Token update successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Transfer form */}
      <div className="flex flex-col gap-12 justify-center tracking-tight text-white/70">
        {/* Crypto Transfer */}
        <CryptoTransferForm
          cryptoTransferParamValues={cryptoTransferParamValues}
          handleModifyTransferRecords={handleModifyTransferRecords}
          setCryptoTransferParamValues={setCryptoTransferParamValues}
          handleCryptoTransferInputOnChange={handleCryptoTransferInputOnChange}
        />

        {/* Token Transfer */}
        <TokenTransferForm
          tokenTransferParamValues={tokenTransferParamValues}
          handleModifyTransferRecords={handleModifyTransferRecords}
          setTokenTransferParamValues={setTokenTransferParamValues}
          handleTokenTransferInputOnChange={handleTokenTransferInputOnChange}
          handleModifyMasterTokenTransferRecords={handleModifyMasterTokenTransferRecords}
        />

        {/* Execute button */}
        <SharedExecuteButtonWithFee
          isLoading={isLoading}
          feeType={'GAS'}
          paramValues={gasLimit}
          placeHolder={'Gas limit...'}
          executeBtnTitle={'Transfer'}
          handleInputOnChange={(e: any) => setGasLimit(e.target.value)}
          explanation={'Optional gas limit for the transaction.'}
          handleInvokingAPIMethod={handleTransferCrypto}
        />
      </div>

      {/* transaction results table */}
      {transactionResultsToShow.length > 0 && (
        <TransactionResultTable
          API="CryptoTransfer"
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

export default CryptoTransfer;
