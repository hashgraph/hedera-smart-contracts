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

import {
  Tr,
  Th,
  Td,
  Link,
  Modal,
  Table,
  Tbody,
  Tooltip,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalContent,
  ModalOverlay,
  TableContainer,
  ModalCloseButton,
} from '@chakra-ui/react';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
} from '@/utils/common/constants';
import { FiExternalLink } from 'react-icons/fi';
import { ITransactionResult } from '@/types/contract-interactions/shared';

interface PageProps {
  isOpen: boolean;
  onClose: () => void;
  hederaNetwork: string;
  transaction: ITransactionResult;
}

const QueryResponseModal = ({ hederaNetwork, transaction, isOpen, onClose }: PageProps) => {
  const ercTokenInfoKeys = ['name', 'symbol', 'decimals', 'totalSupply'];
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      isCentered
    >
      <ModalOverlay />
      <ModalContent
        className="h-fit flex flex-col gap-3 rounded-xl drop-shadow-xl
            bg-secondary text-white font-styrene w-[30rem]"
      >
        {/* title */}
        <ModalHeader>Query Response Data</ModalHeader>
        <ModalCloseButton />

        {/* break line */}
        <hr className="border-t border-white/40 -mt-3" />

        {/* body */}
        <ModalBody>
          <TableContainer className="flex flex-col gap-3 overflow-x-hidden">
            <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
              <Tbody>
                {/* ercTokenInfo */}
                {transaction.ercTokenInfo && (
                  <Tr>
                    <Td>
                      {ercTokenInfoKeys.map((key) => (
                        <div key={key}>
                          {(transaction.ercTokenInfo as any)[key] && (
                            <div className="flex justify-between items-center">
                              <p className="text-button-stroke-violet font-semibold">
                                {key[0].toLocaleUpperCase() + key.slice(1)}
                              </p>
                              <p>{(transaction.ercTokenInfo as any)[key]}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </Td>
                  </Tr>
                )}

                {/* balanceOf */}
                {transaction.balanceOf && (
                  <>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <p>{`${transaction.balanceOf.owner.slice(
                            0,
                            9
                          )}...${transaction.balanceOf.owner.slice(-9)}`}</p>
                          <Tooltip
                            label={'Explore this user on HashScan'}
                            placement="top"
                            fontWeight={'medium'}
                          >
                            <Link
                              href={`https://hashscan.io/${hederaNetwork}/account/${transaction.balanceOf.owner}`}
                              target="_blank"
                            >
                              <FiExternalLink />
                            </Link>
                          </Tooltip>
                        </div>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Balance</Th>
                      <Td className="flex justify-end">
                        <p>{transaction.balanceOf.balance}</p>
                      </Td>
                    </Tr>
                  </>
                )}

                {/* allowances */}
                {transaction.allowances && (
                  <>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <p>{`${transaction.allowances.owner.slice(
                            0,
                            9
                          )}...${transaction.allowances.owner.slice(-9)}`}</p>
                          <Tooltip
                            label={'Explore this user on HashScan'}
                            placement="top"
                            fontWeight={'medium'}
                          >
                            <Link
                              href={`https://hashscan.io/${hederaNetwork}/account/${transaction.allowances.owner}`}
                              target="_blank"
                            >
                              <FiExternalLink />
                            </Link>
                          </Tooltip>
                        </div>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Spender</Th>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <p>{`${transaction.allowances.spender.slice(
                            0,
                            9
                          )}...${transaction.allowances.spender.slice(-9)}`}</p>
                          <Tooltip
                            label={'Explore this user on HashScan'}
                            placement="top"
                            fontWeight={'medium'}
                          >
                            <Link
                              href={`https://hashscan.io/${hederaNetwork}/account/${transaction.allowances.spender}`}
                              target="_blank"
                            >
                              <FiExternalLink />
                            </Link>
                          </Tooltip>
                        </div>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Balance</Th>
                      <Td className="flex justify-end">
                        <p>{transaction.allowances.amount}</p>
                      </Td>
                    </Tr>
                  </>
                )}

                {/* tokenURI */}
                {transaction.tokenURI && (
                  <>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Token ID</Th>
                      <Td className="flex justify-end">
                        <p>{transaction.tokenURI.tokenID}</p>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Token URI</Th>
                      <Td className="flex justify-end">
                        <p>{transaction.tokenURI.tokenURI || 'Not available'}</p>
                      </Td>
                    </Tr>
                  </>
                )}

                {/* ownerOf */}
                {transaction.ownerOf && (
                  <>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Token ID</Th>
                      <Td className="flex justify-end">
                        <p>{transaction.ownerOf.tokenID}</p>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <p>{`${transaction.ownerOf.owner.slice(0, 9)}...${transaction.ownerOf.owner.slice(
                            -9
                          )}`}</p>
                          <Tooltip
                            label={'Explore this user on HashScan'}
                            placement="top"
                            fontWeight={'medium'}
                          >
                            <Link
                              href={`https://hashscan.io/${hederaNetwork}/account/${transaction.ownerOf.owner}`}
                              target="_blank"
                            >
                              <FiExternalLink />
                            </Link>
                          </Tooltip>
                        </div>
                      </Td>
                    </Tr>
                  </>
                )}

                {/* approves */}
                {transaction.approves && (
                  <>
                    <>
                      <Tr>
                        <Th color={HEDERA_BRANDING_COLORS.violet}>Token ID</Th>
                        <Td className="flex justify-end">
                          <p>{transaction.approves.tokenID}</p>
                        </Td>
                      </Tr>
                      <Tr>
                        <Th color={HEDERA_BRANDING_COLORS.violet}>Spender</Th>
                        <Td>
                          <div className="flex gap-1 justify-end">
                            <p>{`${transaction.approves.spender.slice(
                              0,
                              9
                            )}...${transaction.approves.spender.slice(-9)}`}</p>
                            <Tooltip
                              label={'Explore this user on HashScan'}
                              placement="top"
                              fontWeight={'medium'}
                            >
                              <Link
                                href={`https://hashscan.io/${hederaNetwork}/account/${transaction.approves.spender}`}
                                target="_blank"
                              >
                                <FiExternalLink />
                              </Link>
                            </Tooltip>
                          </div>
                        </Td>
                      </Tr>
                    </>
                  </>
                )}

                {/* approval */}
                {transaction.approval && (
                  <>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Owner</Th>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <p>{`${transaction.approval.owner.slice(0, 9)}...${transaction.approval.owner.slice(
                            -9
                          )}`}</p>
                          <Tooltip
                            label={'Explore this user on HashScan'}
                            placement="top"
                            fontWeight={'medium'}
                          >
                            <Link
                              href={`https://hashscan.io/${hederaNetwork}/account/${transaction.approval.owner}`}
                              target="_blank"
                            >
                              <FiExternalLink />
                            </Link>
                          </Tooltip>
                        </div>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Operator</Th>
                      <Td>
                        <div className="flex gap-1 justify-end">
                          <p>{`${transaction.approval.operator.slice(
                            0,
                            9
                          )}...${transaction.approval.operator.slice(-9)}`}</p>
                          <Tooltip
                            label={'Explore this user on HashScan'}
                            placement="top"
                            fontWeight={'medium'}
                          >
                            <Link
                              href={`https://hashscan.io/${hederaNetwork}/account/${transaction.approval.operator}`}
                              target="_blank"
                            >
                              <FiExternalLink />
                            </Link>
                          </Tooltip>
                        </div>
                      </Td>
                    </Tr>
                    <Tr>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>Status</Th>
                      <Td className="flex justify-end">
                        <p>{JSON.stringify(transaction.approval.status).toUpperCase()}</p>
                      </Td>
                    </Tr>
                  </>
                )}
              </Tbody>
            </Table>
          </TableContainer>
        </ModalBody>

        {/* footer */}
        <ModalFooter className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
            }}
            className="border border-button-stroke-violet px-6 py-2 rounded-lg font-medium hover:bg-button-stroke-violet hover:text-white transition duration-300"
          >
            Acknowledge
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default QueryResponseModal;
