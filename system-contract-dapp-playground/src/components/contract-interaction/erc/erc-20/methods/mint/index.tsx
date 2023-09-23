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
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Contract, isAddress } from 'ethers';
import { erc20Mint } from '@/api/hedera/erc20-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import MultiLineMethod from '@/components/common/MultiLineMethod';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { mintParamFields } from '@/utils/contract-interactions/erc/erc20/constant';
import { CONTRACT_NAMES, HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';
import { handleAPIErrors } from '@/components/contract-interaction/hts/shared/methods/handleAPIErrors';
import { useUpdateTransactionResultsToLocalStorage } from '@/components/contract-interaction/hts/shared/hooks/useUpdateLocalStorage';

interface PageProps {
  baseContract: Contract;
}

const Mint = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const currentContractAddress = Cookies.get(CONTRACT_NAMES.ERC20) as string;
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['ERC20-RESULT']['TOKEN-MINT'];
  const [mintParams, setMintParams] = useState({
    recipient: '',
    amount: '',
  });

  /** @dev handle mint token */
  const handleMintToken = async () => {
    // sanitize params
    let sanitizeErr;
    if (!isAddress(mintParams.recipient)) {
      sanitizeErr = 'Recipient address is not a valid address';
    } else if (Number(mintParams.amount) === 0) {
      sanitizeErr = 'Token ammount must be greater than 0';
    }
    if (sanitizeErr) {
      CommonErrorToast({ toaster, title: 'Invalid parameters', description: sanitizeErr });
      return;
    }

    setIsLoading(true);
    const {
      mintRes,
      err: mintErr,
      txHash,
    } = await erc20Mint(baseContract, mintParams.recipient, Number(mintParams.amount));
    setIsLoading(false);

    if (mintErr || !mintRes) {
      handleAPIErrors({
        toaster,
        err: mintErr,
        setTransactionResults,
        transactionHash: txHash,
        transactionResultStorageKey,
        transactionType: 'ERC20-MINT',
        sessionedContractAddress: currentContractAddress,
      });
      return;
    } else {
      // handle succesfull
      setTransactionResults((prev) => [
        ...prev,
        {
          status: 'success',
          txHash: txHash as string,
          transactionResultStorageKey,
          transactionType: 'ERC20-MINT',
          transactionTimeStamp: Date.now(),
          sessionedContractAddress: currentContractAddress,
        },
      ]);

      setIsSuccessful(true);
    }
  };

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  // toast successful
  useEffect(() => {
    if (isSuccessful) {
      toaster({
        title: 'Mint successful 🎉',
        description: 'A new balance has been set for the recipient',
        status: 'success',
        position: 'top',
      });
      setMintParams({ recipient: '', amount: '' });
      setIsSuccessful(false);
    }
  }, [isSuccessful, toaster]);

  return (
    <div className="w-full mx-3 flex justify-center mt-6">
      {/* approve() */}
      <MultiLineMethod
        paramFields={mintParamFields}
        methodName={'Mint'}
        params={mintParams}
        setParams={setMintParams}
        widthSize="w-[360px]"
        isLoading={isLoading}
        handleExecute={handleMintToken}
        explanation="Creates `amount` tokens and assigns them to `recipient`, increasing the total supply."
      />
    </div>
  );
};

export default Mint;
