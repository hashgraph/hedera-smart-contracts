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
import { CSVLink } from 'react-csv';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { FiExternalLink, FiMoreVertical } from 'react-icons/fi';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { usePaginatedTxResults } from '@/hooks/usePaginatedTxResults';
import ConfirmModal from '@/components/common/components/ConfirmModal';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { copyContentToClipboard } from '@/components/common/methods/common';
import { clearCachedTransactions, getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { prepareCSVData, prepareCSVHeaders, prepareTransactionList } from '@/utils/common/helpers';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
} from '@/utils/common/constants';
import {
  Th,
  Tr,
  Td,
  Link,
  Tbody,
  Table,
  Thead,
  Select,
  Popover,
  Tooltip,
  useToast,
  Checkbox,
  useDisclosure,
  PopoverTrigger,
  PopoverContent,
  TableContainer,
} from '@chakra-ui/react';

const ActivitySection = () => {
  const toaster = useToast();
  const TRANSACTION_PAGE_SIZE = 20;
  const CSVHeaders = prepareCSVHeaders();
  const hederaNetwork = Cookies.get('_network');
  const [mounted, setMounted] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [order, setOrder] = useState<'OLDEST' | 'LATEST'>('OLDEST');
  const parsedHederaNetwork = hederaNetwork && JSON.parse(hederaNetwork);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const [selectedTransactionList, setSelectedTransactionList] = useState<ITransactionResult[]>([]);
  const [transactionList, setTransactionList] = useState<ITransactionResult[]>(prepareTransactionList());
  const CSVData = useMemo(
    () => prepareCSVData(selectedTransactionList, parsedHederaNetwork),
    [selectedTransactionList]
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

      // reset selectedTransactionList
      setSelectedTransactionList([]);

      // close modal
      onClose();
    }
  };

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
          <div>
            <Popover placement="right">
              <PopoverTrigger>
                <button
                  disabled={selectedTransactionList.length === 0}
                  className={`border border-white/30 text-sm p-2 rounded-lg flex items-center justify-center ${
                    selectedTransactionList.length > 0
                      ? `cursor-pointer hover:bg-button-stroke-violet transition duration-300`
                      : `cursor-not-allowed text-gray-500`
                  }`}
                >
                  <FiMoreVertical />
                </button>
              </PopoverTrigger>
              <PopoverContent className="bg-button w-fit py-3 border-white/30">
                <div className="flex flex-col gap-3">
                  {/* Export button */}
                  <CSVLink
                    data={CSVData}
                    headers={CSVHeaders}
                    filename={'hedera-system-contract-dapp-transactions.csv'}
                    target="_blank"
                    className={`text-sm pl-3 py-2 pr-6 text-left cursor-pointer hover:bg-neutral-700/50 transition duration-300 w-full`}
                  >
                    Export selected records
                  </CSVLink>

                  {/* remove button */}
                  <button
                    onClick={() => {
                      onOpen();
                    }}
                    className={`text-sm pl-3 py-2 pr-6 text-left cursor-pointer hover:bg-neutral-700/50 transition duration-300 w-full`}
                  >
                    Remove selected records
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {sortedTransactionList.length > 0 ? (
        <>
          {/* transaction table */}
          <TableContainer className="flex flex-col gap-3 overflow-x-hidden">
            <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.unstyled} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
              <Thead>
                <Tr className="border-b">
                  <Th color={HEDERA_BRANDING_COLORS.violet} isNumeric className="flex justify-start">
                    Index
                  </Th>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>Request Type</Th>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>Transaction Type</Th>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>Status</Th>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>Transaction hash</Th>
                  <Th>
                    <Checkbox
                      size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
                      colorScheme="teal"
                      isChecked={allChecked}
                      isIndeterminate={isIndeterminate}
                      onChange={(e) => {
                        setTransactionList((prev) =>
                          prev.map((record) => ({ ...record, selected: e.target.checked }))
                        );
                        if (e.target.checked) {
                          setSelectedTransactionList(
                            transactionList.map((record) => ({ ...record, selected: e.target.checked }))
                          );
                        } else {
                          setSelectedTransactionList([]);
                        }
                      }}
                    />
                  </Th>
                </Tr>
              </Thead>

              <Tbody className="font-light">
                {paginatedTransactionResults.map((transaction) => {
                  return (
                    <Tr
                      key={transaction.txHash}
                      className={` border-b border-white/30 ${
                        transaction.status === 'success' ? 'hover:bg-hedera-green/10' : 'hover:bg-red-400/10'
                      }`}
                    >
                      {/* index */}
                      <Td>
                        <p>{transaction.recordIndex}</p>
                      </Td>

                      {/* request type */}
                      <Td>{transaction.readonly ? `QUERY` : `TRANSACTION`}</Td>

                      {/* Transaction type */}
                      <Td>{transaction.transactionType}</Td>

                      {/* status */}
                      <Td>
                        <p
                          className={transaction.status === 'success' ? `text-hedera-green` : `text-red-400`}
                        >
                          {transaction.status.toUpperCase()}
                        </p>
                      </Td>

                      {/* txHash */}
                      <Td className="cursor-pointer">
                        <div className="flex gap-1 items-center justify-between">
                          {transaction.readonly ? (
                            <>N/A</>
                          ) : (
                            <>
                              <div onClick={() => copyContentToClipboard(transaction.txHash)}>
                                <Popover>
                                  <PopoverTrigger>
                                    <div className="flex gap-1 items-center">
                                      <Tooltip label="click to copy transaction hash">
                                        <p>{`${transaction.txHash.slice(0, 15)}...${transaction.txHash.slice(
                                          -15
                                        )}`}</p>
                                      </Tooltip>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent width={'fit-content'} border={'none'}>
                                    <div className="bg-secondary px-3 py-2 border-none font-medium">
                                      Copied
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <Tooltip
                                label={'Explore this transaction on HashScan'}
                                placement="top"
                                fontWeight={'medium'}
                              >
                                <Link
                                  href={`https://hashscan.io/${parsedHederaNetwork}/transaction/${transaction.txHash}`}
                                  target="_blank"
                                >
                                  <FiExternalLink />
                                </Link>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </Td>

                      <Td>
                        <Checkbox
                          size={HEDERA_CHAKRA_INPUT_BOX_SIZES.medium}
                          colorScheme="teal"
                          isChecked={transaction.selected}
                          onChange={(e) => {
                            // include this record to the global selectedTransactionList state
                            const checkedValue = e.target.checked;
                            if (checkedValue) {
                              setSelectedTransactionList((prev) => [...prev, transaction]);
                              setTransactionList((prev) =>
                                prev.map((record) => {
                                  if (record.txHash === transaction.txHash) {
                                    record.selected = checkedValue;
                                  }
                                  return record;
                                })
                              );
                            } else {
                              setSelectedTransactionList((prev) =>
                                prev.filter((prev) => prev.txHash !== transaction.txHash)
                              );
                              setTransactionList((prev) =>
                                prev.map((record) => {
                                  if (record.txHash === transaction.txHash) {
                                    record.selected = checkedValue;
                                  }
                                  return record;
                                })
                              );
                            }
                          }}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </TableContainer>
          {/* pagination buttons */}
          <div className="flex gap-3 justify-center items-center">
            <Tooltip label="Return to the previous page">
              <button
                onClick={() => setCurrentTransactionPage((prev) => prev - 1)}
                disabled={currentTransactionPage === 1}
                className={`border rounded-lg border-white/30 text-2xl ${
                  currentTransactionPage === 1
                    ? 'hover:cursor-not-allowed text-white/30'
                    : 'hover:cursor-pointer text-white'
                }`}
              >
                <MdNavigateBefore />
              </button>
            </Tooltip>
            <p className="text-base">{currentTransactionPage}</p>
            <Tooltip label="Proceed to the next page">
              <button
                onClick={() => setCurrentTransactionPage((prev) => prev + 1)}
                disabled={paginatedTransactionResults.length < TRANSACTION_PAGE_SIZE}
                className={`border border-white/30 rounded-lg text-2xl cursor-pointer ${
                  paginatedTransactionResults.length < TRANSACTION_PAGE_SIZE
                    ? 'hover:cursor-not-allowed text-white/30'
                    : 'hover:cursor-pointer text-white'
                }`}
              >
                <MdNavigateNext />
              </button>
            </Tooltip>
          </div>
        </>
      ) : (
        <div className="h-full flex justify-center items-center font-styrene text-xl font-light italic text-white/70">
          <p>No transactions have been made.</p>
        </div>
      )}

      <ConfirmModal
        isOpen={isOpen}
        onClose={onClose}
        modalBody={
          <p className="text-white/70">
            By completing this action, the selected transactions will be permanently erased from the
            DApp&apos;s cache, but they will still be accessible through HashScan or other explorer solutions.
          </p>
        }
        modalHeader={'Sure to remove?'}
        handleAcknowledge={handleRemoveRecords}
      />
    </motion.section>
  );
};

export default ActivitySection;
