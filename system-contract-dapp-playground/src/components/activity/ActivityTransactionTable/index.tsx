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

import Link from 'next/link';
import { FiExternalLink } from 'react-icons/fi';
import { Dispatch, SetStateAction } from 'react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { copyContentToClipboard } from '../../common/methods/common';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../../contract-interaction/hts/shared/states/commonStates';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
} from '@/utils/common/constants';
import {
  Tr,
  Th,
  Td,
  Tbody,
  Thead,
  Table,
  Popover,
  Checkbox,
  Tooltip,
  PopoverContent,
  PopoverTrigger,
  TableContainer,
} from '@chakra-ui/react';

interface PageProps {
  allChecked: boolean;
  isIndeterminate: boolean;
  parsedHederaNetwork: any;
  currentTransactionPage: number;
  transactionList: ITransactionResult[];
  paginatedTransactionResults: ITransactionResult[];
  setCurrentTransactionPage: Dispatch<SetStateAction<number>>;
  setTransactionList: Dispatch<SetStateAction<ITransactionResult[]>>;
  setSelectedTransactionList: Dispatch<SetStateAction<ITransactionResult[]>>;
}

const ActivityTransactionTable = ({
  allChecked,
  transactionList,
  isIndeterminate,
  setTransactionList,
  parsedHederaNetwork,
  currentTransactionPage,
  setCurrentTransactionPage,
  setSelectedTransactionList,
  paginatedTransactionResults,
}: PageProps) => {
  return (
    <>
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
                    <p className={transaction.status === 'success' ? `text-hedera-green` : `text-red-400`}>
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
                                <div className="bg-secondary px-3 py-2 border-none font-medium">Copied</div>
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
  );
};

export default ActivityTransactionTable;
