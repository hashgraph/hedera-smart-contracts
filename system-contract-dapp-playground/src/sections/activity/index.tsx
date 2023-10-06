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

'use client';

import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { HEDERA_BRANDING_COLORS } from '@/utils/common/constants';
import { Select, useToast, useDisclosure } from '@chakra-ui/react';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import ConfirmModal from '@/components/common/components/ConfirmModal';
import QueryResponseModal from '@/components/activity/QueryResponseModal';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import ExtraOptionsButton from '@/components/activity/ExtraOptionsButton';
import ActivityTransactionTable from '@/components/activity/ActivityTransactionTable';
import { clearCachedTransactions, getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { prepareCSVData, prepareCSVHeaders, prepareTransactionList } from '@/utils/common/helpers';

const ActivitySection = () => {
  const toaster = useToast();
  const TRANSACTION_PAGE_SIZE = 20;
  const CSVHeaders = prepareCSVHeaders();
  const hederaNetwork = Cookies.get('_network');
  const [mounted, setMounted] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [order, setOrder] = useState<'OLDEST' | 'LATEST'>('OLDEST');
  const parsedHederaNetwork = hederaNetwork && JSON.parse(hederaNetwork);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [selectedTransactionList, setSelectedTransactionList] = useState<ITransactionResult[]>([]);
  const [transactionList, setTransactionList] = useState<ITransactionResult[]>(prepareTransactionList());
  const [queryResponseObj, setQueryReponseObj] = useState({
    isOpen: false,
    selectedTransaction: {} as ITransactionResult,
  });

  const CSVData = useMemo(
    () => prepareCSVData(selectedTransactionList, parsedHederaNetwork),
    [selectedTransactionList, parsedHederaNetwork]
  );

  const allChecked = useMemo(
    () => selectedTransactionList.length === transactionList.length,
    [transactionList, selectedTransactionList]
  );

  const isIndeterminate = useMemo(
    () => selectedTransactionList.length >= 1 && !allChecked,
    [selectedTransactionList, allChecked]
  );

  // sort transactionList based on order
  const sortedTransactionList = useMemo(
    () =>
      transactionList.sort((txA, txB) => {
        return order === 'LATEST'
          ? txB.transactionTimeStamp - txA.transactionTimeStamp
          : txA.transactionTimeStamp - txB.transactionTimeStamp;
      }),
    [order, transactionList]
  );

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(
    currentTransactionPage,
    sortedTransactionList,
    TRANSACTION_PAGE_SIZE,
    order
  );

  /** @dev hande removing selected records */
  const handleRemoveRecords = () => {
    // @logic: selectedTransactionList.length === transactionList.length => remove all
    // @logic: selectedTransactionList.length !== transactionList.length => remove some
    if (selectedTransactionList.length === transactionList.length) {
      // clear localStorage cache
      clearCachedTransactions();

      // update transactionList
      setTransactionList([]);
    } else {
      // remove each transaction in selectedTransactionList
      selectedTransactionList.forEach((record) => {
        // get the cached array stored in localStoraged
        const { storageResult, err: localStorageBalanceErr } = getArrayTypedValuesFromLocalStorage(
          record.transactionResultStorageKey
        );

        // handle err
        if (localStorageBalanceErr) {
          CommonErrorToast({
            toaster,
            title: 'Cannot access transaction results in storage',
            description: "See client's console for more information",
          });
          return;
        }

        // remove record out of the storageResult array
        const filteredTransactionResults = storageResult.filter(
          (transactionResult: ITransactionResult) => transactionResult.txHash !== record.txHash
        );

        // storage the filteredTransactionResults back to storage
        // @notice if  filteredTransactionResults.length === 0, remove that key in storage
        if (filteredTransactionResults.length === 0) {
          localStorage.removeItem(record.transactionResultStorageKey);
        } else {
          localStorage.setItem(
            record.transactionResultStorageKey,
            JSON.stringify(filteredTransactionResults)
          );
        }

        // update transactionList
        setTransactionList((prev) =>
          prev.filter((transactionResult) => transactionResult.txHash !== record.txHash)
        );
      });
    }
    // reset states
    setSelectedTransactionList([]);

    // close modal
    onClose();
  };

  /** @dev when the modal is off, all states relate to the modal must be reset */
  useEffect(() => {
    if (!isOpen) {
      setIsRemoveModalOpen(false);
      setQueryReponseObj((prev) => ({
        ...prev,
        isOpen: false,
        selectedTransaction: {} as ITransactionResult,
      }));
    }
  }, [isOpen]);

  // ensures that the "application mounted" flag is set to ensure consistent UI rendering on both the server and client sides.
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{
        delay: 0.3,
        duration: 0.6,
      }}
      viewport={{ once: true }}
      className="text-white w-full flex pt-7 pb-12 pl-7 flex-col gap-9 h-full min-w-[50rem]"
    >
      {/* Title */}
      <div className="flex flex-col gap-3">
        <h1 className="text-[1.88rem] font-medium leading-10 flex gap-1 whitespace-nowrap">
          Recent Activity
        </h1>

        {/* break line */}
        <hr className="border-t border-white/40" />
      </div>

      {sortedTransactionList.length > 0 && (
        <div className="flex justify-between items-center">
          {/* Filter */}
          <div className="w-[200px]">
            <Select
              _focus={{ borderColor: HEDERA_BRANDING_COLORS.purple }}
              className="hover:cursor-pointer rounded-md border-white/30"
              placeholder="Sort by"
              onChange={(e) => {
                const value = e.target.value === '' ? 'OLDEST' : e.target.value;
                setOrder(value as 'LATEST' | 'OLDEST');
              }}
            >
              <option value={'LATEST'}>Latest to oldest</option>
              <option value={'OLDEST'}>Oldest to latest</option>
            </Select>
          </div>

          {/* Extra options button */}
          <ExtraOptionsButton
            onOpen={onOpen}
            CSVData={CSVData}
            CSVHeaders={CSVHeaders}
            setIsRemoveModalOpen={setIsRemoveModalOpen}
            selectedTransactionList={selectedTransactionList}
          />
        </div>
      )}

      {sortedTransactionList.length > 0 ? (
        <ActivityTransactionTable
          onOpen={onOpen}
          allChecked={allChecked}
          isIndeterminate={isIndeterminate}
          transactionList={transactionList}
          setQueryReponseObj={setQueryReponseObj}
          setTransactionList={setTransactionList}
          parsedHederaNetwork={parsedHederaNetwork}
          TRANSACTION_PAGE_SIZE={TRANSACTION_PAGE_SIZE}
          currentTransactionPage={currentTransactionPage}
          setCurrentTransactionPage={setCurrentTransactionPage}
          setSelectedTransactionList={setSelectedTransactionList}
          paginatedTransactionResults={paginatedTransactionResults}
        />
      ) : (
        <div className="h-full flex justify-center items-center font-styrene text-xl font-light italic text-white/70">
          <p>No transactions have been made.</p>
        </div>
      )}

      {queryResponseObj.isOpen && (
        <QueryResponseModal
          isOpen={isOpen}
          onClose={onClose}
          hederaNetwork={parsedHederaNetwork}
          transaction={queryResponseObj.selectedTransaction}
        />
      )}

      {isRemoveModalOpen && (
        <ConfirmModal
          isOpen={isOpen}
          onClose={onClose}
          modalBody={
            <p className="text-white/70">
              By completing this action, the selected transactions will be permanently erased from the
              DApp&apos;s cache, but they will still be accessible through HashScan or other explorer
              solutions.
            </p>
          }
          modalHeader={'Sure to remove?'}
          handleAcknowledge={handleRemoveRecords}
        />
      )}
    </motion.section>
  );
};

export default ActivitySection;
