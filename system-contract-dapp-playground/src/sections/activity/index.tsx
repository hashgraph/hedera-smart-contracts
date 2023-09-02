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
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiExternalLink } from 'react-icons/fi';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { usePaginatedTxResults } from '@/components/contract-interaction/hts/shared/hooks/usePaginatedTxResults';
import {
  Th,
  Tr,
  Td,
  Link,
  Tbody,
  Table,
  Thead,
  Popover,
  Tooltip,
  PopoverTrigger,
  PopoverContent,
  TableContainer,
} from '@chakra-ui/react';
import { prepareTransactionList } from '@/utils/common/helpers';

const ActivitySection = () => {
  const TRANSACTION_PAGE_SIZE = 20;
  const hederaNetwork = Cookies.get('_network');
  const [mounted, setMounted] = useState(false);
  const [transactionList] = useState(prepareTransactionList());
  const parsedHederaNetwork = hederaNetwork && JSON.parse(hederaNetwork);
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);

  // declare a paginatedTransactionResults
  const paginatedTransactionResults = usePaginatedTxResults(
    currentTransactionPage,
    transactionList,
    TRANSACTION_PAGE_SIZE
  );

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
      className="text-white w-full flex pt-7 pb-12 pl-7 flex-col gap-9 h-full"
    >
      {/* Title */}
      <div className="flex flex-col gap-3">
        <h1 className="text-[1.88rem] font-medium leading-10 flex gap-1 whitespace-nowrap">
          Recent Activity
        </h1>

        {/* break line */}
        <hr className="border-t border-white/40" />
      </div>

      {transactionList.length > 0 ? (
        <>
          {/* transaction table */}
          <TableContainer className="flex flex-col gap-3 overflow-x-hidden">
            <Table variant="unstyled" size={'sm'}>
              <Thead>
                <Tr className="border-b">
                  <Th color={'#82ACF9'} isNumeric className="flex justify-start">
                    Index
                  </Th>
                  <Th color={'#82ACF9'}>Transaction Type</Th>
                  <Th color={'#82ACF9'}>Status</Th>
                  <Th color={'#82ACF9'}>Transaction hash</Th>
                </Tr>
              </Thead>

              <Tbody className="font-light">
                {paginatedTransactionResults.map((transaction, index) => {
                  return (
                    <Tr
                      key={transaction.txHash}
                      className={` border-b border-white/30 ${
                        transaction.status === 'sucess'
                          ? 'hover:bg-hedera-green/10'
                          : 'hover:bg-red-400/10'
                      }`}
                    >
                      {/* index */}
                      <Td>
                        <p>{index + (currentTransactionPage - 1) * TRANSACTION_PAGE_SIZE + 1}</p>
                      </Td>

                      {/* Transaction TYPE */}
                      <Td>{transaction.transactionType}</Td>

                      {/* status */}
                      <Td>
                        <p
                          className={
                            transaction.status === 'sucess' ? `text-hedera-green` : `text-red-400`
                          }
                        >
                          {transaction.status.toUpperCase()}
                        </p>
                      </Td>

                      {/* txHash */}
                      {/* transaction hash */}
                      <Td className="cursor-pointer">
                        <div className="flex gap-1 items-center justify-between">
                          <div onClick={() => navigator.clipboard.writeText(transaction.txHash)}>
                            <Popover>
                              <PopoverTrigger>
                                <div className="flex gap-1 items-center">
                                  <Tooltip label="click to copy transaction hash">
                                    <p>{transaction.txHash}</p>
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
                        </div>
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
    </motion.section>
  );
};

export default ActivitySection;
