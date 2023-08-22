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

import { Contract } from 'ethers';
import { isAddress } from 'ethers';
import { useToast } from '@chakra-ui/react';
import { erc20Transfers } from '@/api/hedera/erc20-interactions';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import MultiLineMethod from '@/components/common/MultiLineMethod';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  transferParamFields,
  transferFromParamFields,
} from '@/utils/contract-interactions/erc/constant';

interface PageProps {
  baseContract: Contract;
}

const Transfer = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [isLoading, setIsloading] = useState({
    transfer: false,
    transferFrom: false,
  });
  const [isSuccessful, setIsSuccessful] = useState({
    transfer: false,
    transferFrom: false,
  });

  const [transferParams, setTransferParams] = useState({
    owner: '',
    recipient: '',
    amount: '',
  });
  const [transferFromParams, setTransferFromParams] = useState({
    owner: '',
    recipient: '',
    amount: '',
  });

  const [methodState, setMethodStates] = useState({
    transfer: {
      isSuccessful: false,
      isLoading: false,
    },
    transferFrom: {
      isSuccessful: false,
      isLoading: false,
    },
  });

  /** @dev handle execute methods */
  const handleExecutingMethods = async (
    method: 'transfer' | 'transferFrom',
    params: { owner: string; recipient: string; amount: string },
    setParams: Dispatch<
      SetStateAction<{
        owner: string;
        recipient: string;
        amount: string;
      }>
    >
  ) => {
    // sanitize params & toast error invalid params
    let paramErrDescription;
    if (method === 'transferFrom' && !isAddress(params.owner)) {
      paramErrDescription = 'Token owner address is not a valid address';
    } else if (!isAddress(params.recipient)) {
      paramErrDescription = 'Recipient address is not a valid address';
    }
    if (paramErrDescription) {
      CommonErrorToast({
        toaster,
        title: 'Invalid parameters',
        description: paramErrDescription,
      });
      return;
    }

    // turn on isLoading
    setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: true } }));

    // invoke method API
    const tokenTransferRes = await erc20Transfers(
      baseContract,
      method,
      params.recipient,
      Number(params.amount),
      params.owner
    );

    // turn off isLoading
    setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isLoading: false } }));

    // handle error
    if (tokenTransferRes.err || !tokenTransferRes[`${method}Res`]) {
      let errorMessage = "See client's console for more information";

      // @notice 4001 error code is returned when a metamask wallet request is rejected by the user
      // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
      if (JSON.stringify(tokenTransferRes.err).indexOf('4001') !== -1) {
        errorMessage = 'You have rejected the request.';
      } else if (
        JSON.stringify(tokenTransferRes.err).indexOf('nonce has already been used') !== -1
      ) {
        errorMessage = 'Nonce has already been used. Please try again!';
      } else if (
        JSON.stringify(tokenTransferRes.err).indexOf('transfer amount exceeds balance') !== -1
      ) {
        errorMessage = 'Transfer amount exceeds balance';
      } else if (JSON.stringify(tokenTransferRes.err).indexOf('insufficient allowance') !== -1) {
        errorMessage = 'Insufficient allowance';
      }

      CommonErrorToast({
        toaster,
        title: `Cannot execute function ${method}()`,
        description: errorMessage,
      });
      return;
    } else {
      // turn isSuccessful on
      setMethodStates((prev) => ({ ...prev, [method]: { ...prev[method], isSuccessful: true } }));
      setParams({ owner: '', recipient: '', amount: '' });
    }
  };

  // toast successful
  useEffect(() => {
    if (methodState.transfer.isSuccessful || methodState.transferFrom.isSuccessful) {
      toaster({
        title: 'Transfer successful 🎉',
        description: 'A new balance has been set for the recipient',
        status: 'success',
        position: 'top',
      });
      if (methodState.transfer.isSuccessful) {
        setTransferParams({ owner: '', recipient: '', amount: '' });
        setMethodStates((prev) => ({
          ...prev,
          transfer: { ...prev.transfer, isSuccessful: false },
        }));
      } else {
        setTransferFromParams({ owner: '', recipient: '', amount: '' });
        setMethodStates((prev) => ({
          ...prev,
          transferFrom: { ...prev.transferFrom, isSuccessful: false },
        }));
      }
    }
  }, [methodState, toaster]);

  return (
    <div className="w-full mx-3 flex">
      {/* wrapper */}
      <div className="w-full flex gap-12 justify-between items-end">
        {/* transfer() */}
        <MultiLineMethod
          paramFields={transferParamFields}
          methodName={'Transfer'}
          params={transferParams}
          widthSize="w-[360px]"
          setParams={setTransferParams}
          isLoading={methodState.transfer.isLoading}
          handleExecute={() =>
            handleExecutingMethods('transfer', transferParams, setTransferParams)
          }
          explanation="Moves `amount` tokens from the caller’s account to `recipient`."
        />

        {/* transferFrom() */}
        <MultiLineMethod
          paramFields={transferFromParamFields}
          methodName={'Transfer From'}
          widthSize="w-[360px]"
          params={transferFromParams}
          setParams={setTransferFromParams}
          isLoading={methodState.transferFrom.isLoading}
          handleExecute={() =>
            handleExecutingMethods('transferFrom', transferFromParams, setTransferFromParams)
          }
          explanation="Moves amount tokens from `token owner` to `recipient` using the allowance mechanism. `Token amount` is then deducted from the caller’s allowance."
        />
      </div>
    </div>
  );
};

export default Transfer;
