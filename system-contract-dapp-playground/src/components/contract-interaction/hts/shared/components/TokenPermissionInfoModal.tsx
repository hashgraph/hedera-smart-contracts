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

import { Dispatch, SetStateAction } from 'react';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import {
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_CHAKRA_INPUT_BOX_SIZES,
} from '@/utils/common/constants';
import {
  Tr,
  Th,
  Td,
  Modal,
  Table,
  Tbody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalContent,
  TableContainer,
  ModalCloseButton,
} from '@chakra-ui/react';

interface PageProps {
  APIMethods: 'ALLOWANCE' | 'GET_APPROVED' | 'IS_APPROVAL';
  tokenInfo: any;
  eventMaps: any;
  isOpen: boolean;
  onClose: () => void;
  initialParamValues?: any;
  setTokenInfo?: Dispatch<any>;
  setParamValues?: Dispatch<any>;
  setIsSuccessful?: Dispatch<SetStateAction<boolean>>;
}

const TokenPermissionInfoModal = ({
  APIMethods,
  tokenInfo,
  isOpen,
  onClose,
  setTokenInfo,
  eventMaps,
  setParamValues,
  setIsSuccessful,
  initialParamValues,
}: PageProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        if (setTokenInfo) setTokenInfo({});
        if (setIsSuccessful) setIsSuccessful(false);
        if (setParamValues) setParamValues(initialParamValues);
      }}
      isCentered
      size={'3xl'}
    >
      <ModalOverlay />
      <ModalContent
        className="h-fit flex flex-col gap-3 rounded-xl drop-shadow-xl
bg-secondary text-white font-styrene w-[30rem]"
      >
        {/* title */}
        <ModalHeader>Token Information</ModalHeader>
        <ModalCloseButton />

        {/* break line */}
        <hr className="border-t border-white/40 -mt-3" />

        {/* body */}
        <ModalBody>
          <TableContainer className="overflow-x-hidden">
            <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
              <Tbody>
                <Tr>
                  <Th color={HEDERA_BRANDING_COLORS.violet}>
                    {convertCalmelCaseFunctionName(eventMaps[APIMethods])}
                  </Th>
                  {APIMethods === 'GET_APPROVED' && (
                    <Td className="flex justify-end">
                      {`${tokenInfo.slice(0, 6)}...${tokenInfo.slice(-6)}`}
                    </Td>
                  )}
                  {APIMethods === 'IS_APPROVAL' && (
                    <Td className="flex justify-end">{JSON.stringify(tokenInfo === 1).toUpperCase()}</Td>
                  )}
                  {APIMethods === 'ALLOWANCE' && <Td className="flex justify-end">{tokenInfo}</Td>}
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </ModalBody>

        {/* footer */}
        <ModalFooter className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              if (setTokenInfo) setTokenInfo({});
              if (setIsSuccessful) setIsSuccessful(false);
              if (setParamValues) setParamValues(initialParamValues);
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

export default TokenPermissionInfoModal;
