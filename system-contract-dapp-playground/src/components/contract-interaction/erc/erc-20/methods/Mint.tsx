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

import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Contract, isAddress } from 'ethers';
import { mintParamFields } from '../../utils/constant';
import MultiLineMethod from '../common/MultiLineMethod';
import { erc20Mint } from '@/api/hedera/erc20-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';

interface PageProps {
  baseContract: Contract;
}

const Mint = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
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
    const { mintRes, err: mintErr } = await erc20Mint(
      baseContract,
      mintParams.recipient,
      Number(mintParams.amount)
    );
    setIsLoading(false);

    if (mintErr || !mintRes) {
      let errorMessage = "See client's console for more information";

      // @notice 4001 error code is returned when a metamask wallet request is rejected by the user
      // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
      if (JSON.stringify(mintErr).indexOf('4001') !== -1) {
        errorMessage = 'You have rejected the request.';
      } else if (JSON.stringify(mintErr).indexOf('nonce has already been used') !== -1) {
        errorMessage = 'Nonce has already been used. Please try again!';
      }

      CommonErrorToast({
        toaster,
        title: 'Cannot execute mint function',
        description: errorMessage,
      });
      return;
    }

    // turn isSuccessful on
    setIsSuccessful(true);
  };

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
