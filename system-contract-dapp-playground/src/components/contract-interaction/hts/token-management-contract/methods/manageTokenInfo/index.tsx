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
import TokenInfoForm from './TokenInfoForm';
import { useToast } from '@chakra-ui/react';
import TokenExpiryForm from './TokenExpiryForm';
import { useState, useMemo, useEffect } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { handleAPIErrors } from '../../../../../common/methods/handleAPIErrors';
import { useToastSuccessful } from '../../../../../../hooks/useToastSuccessful';
import { usePaginatedTxResults } from '../../../../../../hooks/usePaginatedTxResults';
import { SharedSigningKeysComponent } from '../../../shared/components/SigningKeysForm';
import { TransactionResultTable } from '../../../../../common/components/TransactionResultTable';
import { HederaTokenKeyTypes, TRANSACTION_PAGE_SIZE } from '../../../shared/states/commonStates';
import { manageTokenInfomation } from '@/api/hedera/hts-interactions/tokenManagement-interactions';
import { handleSanitizeHederaFormInputs } from '../../../../../common/methods/handleSanitizeFormInputs';
import { useUpdateTransactionResultsToLocalStorage } from '../../../../../../hooks/useUpdateLocalStorage';
import useFilterTransactionsByContractAddress from '../../../../../../hooks/useFilterTransactionsByContractAddress';
import { handleRetrievingTransactionResultsFromLocalStorage } from '../../../../../common/methods/handleRetrievingTransactionResultsFromLocalStorage';
import {
  CONTRACT_NAMES,
  HEDERA_COMMON_TRANSACTION_TYPE,
  HEDERA_TRANSACTION_RESULT_STORAGE_KEYS,
} from '@/utils/common/constants';
import {
  DEFAULT_TOKEN_EXIPIRY_VALUE,
  htsUpdateTokenInfoParamFields,
  DEFAULT_HEDERA_TOKEN_INFO_VALUE,
} from '@/utils/contract-interactions/HTS/token-management/constant';
import {
  SharedFormButton,
  SharedFormInputField,
  SharedExecuteButtonWithFee,
} from '../../../shared/components/ParamInputForm';

interface PageProps {
  baseContract: Contract;
}

type API_NAMES = 'UPDATE_INFO' | 'UPDATE_EXPIRY' | 'UPDATE_KEYS';

const ManageTokenInfo = ({ baseContract }: PageProps) => {
  // general states
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const HEDERA_NETWORK = JSON.parse(Cookies.get('_network') as string);
  const [APIMethods, setAPIMethods] = useState<API_NAMES>('UPDATE_INFO');
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const signerAddress = JSON.parse(Cookies.get('_connectedAccounts') as string)[0];
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.TOKEN_MANAGE) as string;
  const [transactionResults, setTransactionResults] = useState<ITransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['TOKEN-MANAGE']['TOKEN-INFO'];
  const APIButtonTitles: { API: API_NAMES; apiSwitchTitle: string; executeTitle: string }[] = [
    {
      API: 'UPDATE_INFO',
      apiSwitchTitle: 'General Information',
      executeTitle: 'Update Token Information',
    },
    { API: 'UPDATE_EXPIRY', apiSwitchTitle: 'Token Exipry', executeTitle: 'Update Token Expiry' },
    { API: 'UPDATE_KEYS', apiSwitchTitle: 'Token Keys', executeTitle: 'Update Token Keys' },
  ];

  const tokenInfoFields = useMemo(() => {
    switch (APIMethods) {
      case 'UPDATE_INFO':
        return [
          ['name', 'symbol', 'memo'],
          ['treasury', 'maxSupply'],
        ];
      case 'UPDATE_EXPIRY':
        return ['second', 'autoRenewAccount', 'autoRenewPeriod'];
    }
  }, [APIMethods]);

  const initialParamValues = {
    name: '',
    memo: '',
    second: '',
    symbol: '',
    treasury: '',
    feeValue: '',
    maxSupply: '',
    freezeStatus: false,
    autoRenewPeriod: '',
    autoRenewAccount: '',
    tokenSupplyType: false,
    hederaTokenAddress: '',
  };
  const [paramValues, setParamValues] = useState<any>(initialParamValues);

  const transactionResultsToShow = useFilterTransactionsByContractAddress(
    transactionResults,
    currentContractAddress
  );

  const HederaTokenKeyValueType: IHederaTokenServiceKeyValueType[] = [
    'inheritAccountKey',
    'contractId',
    'ed25519',
    'ECDSA_secp256k1',
    'delegatableContractId',
  ];

  const keyTypeArrays = [
    'ADMIN',
    'KYC',
    'FREEZE',
    'WIPE',
    'SUPPLY',
    'FEE',
    'PAUSE',
  ] as IHederaTokenServiceKeyType[];

  const transactionTypeMap = {
    UPDATE_INFO: HEDERA_COMMON_TRANSACTION_TYPE.HTS_FREEZE_TOKEN,
    UPDATE_EXPIRY: HEDERA_COMMON_TRANSACTION_TYPE.HTS_REVOKE_KYC,
    UPDATE_KEYS: HEDERA_COMMON_TRANSACTION_TYPE.HTS_UNFREEZE_TOKEN,
  };

  const initialKeyValues = keyTypeArrays.map((keyType) => ({
    keyType: keyType,
    keyValueType: 'inheritAccountKey',
    keyValue: '',
  })) as ICommonKeyObject[];

  // Keys states
  const [keys, setKeys] = useState<ICommonKeyObject[]>([]); // keeps track of keys array to pass to the API
  const [chosenKeys, setChosenKeys] = useState(new Set<IHederaTokenServiceKeyType>()); // keeps track of keyTypes which have already been chosen in the list
  const [keyTypesToShow, setKeyTypesToShow] = useState(new Set(HederaTokenKeyTypes)); // keeps track of the left over keyTypes to show in the drop down

  useEffect(() => {
    setKeys((prev) =>
      prev.map((key) => {
        key.keyValueType = 'inheritAccountKey';
        return key;
      })
    );
  }, [APIMethods]);

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
  const handleUpdatingTokenInfo = async (API: API_NAMES) => {
    // destructuring param values
    const {
      name,
      memo,
      second,
      symbol,
      treasury,
      feeValue,
      maxSupply,
      freezeStatus,
      autoRenewPeriod,
      tokenSupplyType,
      autoRenewAccount,
      hederaTokenAddress,
    } = paramValues;

    // sanitize params
    let sanitizeErr;
    switch (API) {
      case 'UPDATE_INFO':
        sanitizeErr = handleSanitizeHederaFormInputs({
          API: 'UpdateTokenInfo',
          hederaTokenAddress,
          maxSupply,
          treasury,
          symbol,
          name,
        });
        break;
      case 'UPDATE_EXPIRY':
        sanitizeErr = handleSanitizeHederaFormInputs({
          API: 'UpdateTokenExpiry',
          second,
          autoRenewPeriod,
          autoRenewAccount,
          hederaTokenAddress,
        });
        break;
    }
    // toast error if any param is invalid
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    // prepare params for manageTokenInformation() API method
    const tokenInfo = {
      ...DEFAULT_HEDERA_TOKEN_INFO_VALUE,
      name,
      symbol,
      memo,
      treasury,
      maxSupply,
      freezeStatus,
      tokenSupplyType,
    } as IHederaTokenServiceHederaToken;

    const expiryInfo = {
      ...DEFAULT_TOKEN_EXIPIRY_VALUE,
      second: Number(second),
      autoRenewAccount,
      autoRenewPeriod,
    } as IHederaTokenServiceExpiry;

    // turn is loading on
    setIsLoading(true);

    // invoke method APIS
    const { result, transactionHash, err } = await manageTokenInfomation(
      baseContract,
      signerAddress,
      HEDERA_NETWORK,
      APIMethods,
      hederaTokenAddress,
      Number(feeValue),
      tokenInfo,
      expiryInfo,
      keys
    );

    // turn is loading on
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
        transactionType: transactionTypeMap[APIMethods],
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
          transactionType: transactionTypeMap[APIMethods],
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
    setKeys,
    isSuccessful,
    setParamValues,
    setIsSuccessful,
    initialKeyValues,
    transactionResults,
    setCurrentTransactionPage,
    resetParamValues: initialParamValues,
    toastTitle: 'Token update successful',
  });

  return (
    <div className="w-full mx-3 flex justify-center mt-6 flex-col gap-20">
      {/* Update token form */}
      <div className="flex flex-col gap-6 justify-center tracking-tight text-white/70">
        {/* notice component */}
        <p className="text-sm whitespace-normal -mb-4">
          <span className="italic font-bold">*important:</span> Should you choose not to update certain
          fields, kindly populate the token&apos;s current values.
        </p>

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

        {/* Hedera token address */}
        <SharedFormInputField
          param={'hederaTokenAddress'}
          handleInputOnChange={handleInputOnChange}
          paramValue={paramValues['hederaTokenAddress']}
          paramKey={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].paramKey}
          paramType={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].inputType}
          paramSize={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].inputSize}
          explanation={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].explanation}
          paramClassName={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].inputClassname}
          paramPlaceholder={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].inputPlaceholder}
          paramFocusColor={(htsUpdateTokenInfoParamFields as any)['hederaTokenAddress'].inputFocusBorderColor}
        />

        {/* UPDATE_INFO form */}
        {APIMethods === 'UPDATE_INFO' && (
          <TokenInfoForm
            paramValues={paramValues}
            setParamValues={setParamValues}
            handleInputOnChange={handleInputOnChange}
            tokenInfoFields={tokenInfoFields as string[][]}
          />
        )}

        {/* UPDATE_EXPIRY form */}
        {APIMethods === 'UPDATE_EXPIRY' && (
          <TokenExpiryForm
            paramValues={paramValues}
            handleInputOnChange={handleInputOnChange}
            tokenInfoFields={tokenInfoFields as string[]}
          />
        )}

        {/* UPDATE_KEYS form */}
        {APIMethods === 'UPDATE_KEYS' && (
          <>
            {/* keys */}
            <SharedSigningKeysComponent
              keys={keys}
              setKeys={setKeys}
              chosenKeys={chosenKeys}
              setChosenKeys={setChosenKeys}
              keyTypesToShow={keyTypesToShow}
              setKeyTypesToShow={setKeyTypesToShow}
              HederaTokenKeyTypes={HederaTokenKeyTypes}
              buttonTitle="Add desired signing keys to update"
              HederaTokenKeyValueType={HederaTokenKeyValueType}
            />
          </>
        )}

        {/* Execute buttons */}
        {APIButtonTitles.map((APIButton) => {
          if (APIMethods === APIButton.API) {
            return (
              <div key={APIButton.API} className="w-full">
                <SharedExecuteButtonWithFee
                  isLoading={isLoading}
                  feeType={'GAS'}
                  paramValues={paramValues.feeValue}
                  placeHolder={'Gas limit...'}
                  executeBtnTitle={APIButton.executeTitle}
                  handleInputOnChange={handleInputOnChange}
                  explanation={'Optional gas limit for the transaction.'}
                  handleInvokingAPIMethod={() => handleUpdatingTokenInfo(APIButton.API)}
                />
              </div>
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

export default ManageTokenInfo;
