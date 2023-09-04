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

import Image from 'next/image';
import { Contract } from 'ethers';
import { isAddress } from 'ethers';
import MultiLineMethod from '@/components/common/MultiLineMethod';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { TransactionResult } from '@/types/contract-interactions/HTS';
import { erc721TokenApprove } from '@/api/hedera/erc721-interactions';
import HederaCommonTextField from '@/components/common/HederaCommonTextField';
import { Th, Tr, Table, Tbody, Thead, useToast, TableContainer } from '@chakra-ui/react';
import { approveERC721ParamFields } from '@/utils/contract-interactions/erc/erc721/constant';
import useUpdateMapStateUILocalStorage from '../../../shared/hooks/useUpdateMapStateUILocalStorage';
import { handleAPIErrors } from '@/components/contract-interaction/hts/shared/methods/handleAPIErrors';
import useRetrieveMapValueFromLocalStorage from '../../../shared/hooks/useRetrieveMapValueFromLocalStorage';
import { useUpdateTransactionResultsToLocalStorage } from '@/components/contract-interaction/hts/shared/hooks/useUpdateLocalStorage';
import { handleRetrievingTransactionResultsFromLocalStorage } from '@/components/contract-interaction/hts/shared/methods/handleRetrievingTransactionResultsFromLocalStorage';

interface PageProps {
  baseContract: Contract;
}

const ERC721Approve = ({ baseContract }: PageProps) => {
  const toaster = useToast();
  const [successStatus, setSuccessStatus] = useState(false);
  const [ractNodes, setReactNodes] = useState<ReactNode[]>([]);
  const [getApproveTokenId, setGetApproveTokenId] = useState('');
  const transactionResultStorageKey = 'HEDERA.EIP.ERC-721.APPROVE-RESULTS';
  const [tokenSpenders, setTokenSpenders] = useState(new Map<number, string>());
  const [transactionResults, setTransactionResults] = useState<TransactionResult[]>([]);
  const tokenSpenderResultsStorageKey = 'HEDERA.EIP.ERC-721.GET-APPROVE-RESULTS.READONLY';
  const [approveParams, setApproveParams] = useState({
    spenderAddress: '',
    tokenId: '',
  });
  const [isLoading, setIsLoading] = useState({
    APPROVE: false,
    GET_APPROVE: false,
  });

  /** @dev retrieve approve transaction results from localStorage to maintain data on re-renders */
  useEffect(() => {
    handleRetrievingTransactionResultsFromLocalStorage(
      toaster,
      transactionResultStorageKey,
      undefined,
      setTransactionResults
    );
  }, [toaster]);

  /** @dev retrieve balances from localStorage to maintain data on re-renders */
  useRetrieveMapValueFromLocalStorage(toaster, tokenSpenderResultsStorageKey, setTokenSpenders);

  /**
   * @dev handle executing methods
   */
  const handleExecutingMethods = useCallback(
    async (method: 'APPROVE' | 'GET_APPROVE') => {
      // toast error invalid params
      let paramErrDescription;
      if (method === 'APPROVE') {
        if (!isAddress(approveParams.spenderAddress)) {
          paramErrDescription = 'Spender address is invalid';
        } else if (Number(approveParams.tokenId) < 0) {
          paramErrDescription = 'TokenID cannot be negative';
        }
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
      setIsLoading((prev) => ({ ...prev, [method]: true }));

      // invoke method API
      const erc721ApproveResult = await erc721TokenApprove(
        baseContract,
        method,
        approveParams.spenderAddress,
        method === 'APPROVE' ? Number(approveParams.tokenId) : Number(getApproveTokenId)
      );

      // turn off isLoading
      setIsLoading((prev) => ({ ...prev, [method]: false }));

      // handle err
      if (erc721ApproveResult.err && method === 'APPROVE') {
        handleAPIErrors({
          toaster,
          setTransactionResults,
          err: erc721ApproveResult.err,
          transactionHash: erc721ApproveResult.txHash,
          transactionType: 'ERC721-APPROVE',
        });
        return;
      } else {
        // update transaction results
        if (erc721ApproveResult.txHash) {
          setTransactionResults((prev) => [
            ...prev,
            {
              status: 'sucess',
              transactionTimeStamp: Date.now(),
              txHash: erc721ApproveResult.txHash as string,
              transactionType: 'ERC721-APPROVE',
            },
          ]);

          setApproveParams({ spenderAddress: '', tokenId: '' });
          setSuccessStatus(true);
        }

        if (method === 'GET_APPROVE') {
          // udpate tokenOwners
          setTokenSpenders((prev) =>
            new Map(prev).set(
              Number(getApproveTokenId),
              erc721ApproveResult.approvedAccountRes || ''
            )
          );
          setGetApproveTokenId('');
        }
      }
    },
    [toaster, baseContract, getApproveTokenId, approveParams.spenderAddress, approveParams.tokenId]
  );

  /** @dev listen to change event on transactionResults state => load to localStorage  */
  useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);

  /** @dev listen to change event on tokenOwners state => update UI & localStorage */
  useUpdateMapStateUILocalStorage({
    toaster,
    baseContract,
    setReactNodes,
    mapValues: tokenSpenders,
    mapType: 'GET_APPROVE',
    setMapValues: setTokenSpenders,
    handleExecuteMethodAPI: handleExecutingMethods,
    transactionResultStorageKey: tokenSpenderResultsStorageKey,
  });

  // toast executing successful
  useEffect(() => {
    if (successStatus) {
      toaster({
        title: 'Approve successful 🎉',
        description: 'A new allowance has been set for the recipient',
        status: 'success',
        position: 'top',
      });

      setSuccessStatus(false);
    }
  }, [successStatus, toaster]);

  return (
    <div className="w-full mx-3 flex flex-col gap-20 items-center">
      {/* wrapper */}
      <div className="w-full flex gap-6 justify-center items-end">
        {/* approve() */}
        <MultiLineMethod
          paramFields={approveERC721ParamFields}
          isLoading={isLoading.APPROVE}
          methodName={'Approve'}
          widthSize="w-[700px]"
          params={approveParams}
          setParams={setApproveParams}
          handleExecute={() => handleExecutingMethods('APPROVE')}
          explanation="Sets amount as the allowance of `spender` over the caller’s tokens."
        />
      </div>

      <div className="flex gap-12 items-center w-[580px]">
        {/* Get Approve */}
        <HederaCommonTextField
          size={'md'}
          value={getApproveTokenId}
          title={'Token ID'}
          explanation={'Returns the token owner of the token.'}
          placeholder={'Token ID...'}
          type={'text'}
          setValue={setGetApproveTokenId}
        />

        {/* execute button */}
        <button
          onClick={() => handleExecutingMethods('GET_APPROVE')}
          disabled={isLoading.GET_APPROVE}
          className={`border mt-3 w-48 py-2 rounded-xl transition duration-300 ${
            isLoading.GET_APPROVE
              ? 'cursor-not-allowed border-white/30 text-white/30'
              : 'border-button-stroke-violet text-button-stroke-violet hover:bg-button-stroke-violet/60 hover:text-white'
          }`}
        >
          {isLoading.GET_APPROVE ? (
            <div className="flex gap-1 justify-center">
              Executing...
              <Image
                src={'/brandings/hedera-logomark.svg'}
                alt={'hedera-logomark'}
                width={15}
                height={15}
                className="animate-bounce"
              />
            </div>
          ) : (
            <>Get Approve</>
          )}
        </button>
      </div>

      <div className="flex flex-col gap-6 text-base">
        {/* display balances */}
        {tokenSpenders.size > 0 && (
          <TableContainer>
            <Table variant="simple" size={'sm'}>
              <Thead>
                <Tr>
                  <Th color={'#82ACF9'} isNumeric>
                    Token ID
                  </Th>
                  <Th color={'#82ACF9'}>Token Owner</Th>
                  <Th />
                  <Th />
                </Tr>
              </Thead>
              <Tbody className="w-full">{ractNodes}</Tbody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
};

export default ERC721Approve;
