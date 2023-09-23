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
import React, { Dispatch, SetStateAction } from 'react';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import { prepareInfoValuesToShow } from '../../../../common/methods/prepareInfoValuesToShow';
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
import {
  TOKEN_INFO_NFT_KEYS,
  TOKEN_INFO_BASIC_KEYS,
  TOKEN_INFO_ADVANCED_KEYS,
} from '@/utils/contract-interactions/HTS/token-query/constant';

interface PageProps {
  tokenInfo: any;
  isOpen: boolean;
  onClose: () => void;
  hederaNetwork: string;
  initialParamValues?: any;
  hederaTokenAddress: string;
  setTokenInfo?: Dispatch<any>;
  setParamValues?: Dispatch<any>;
  setShowToken?: Dispatch<SetStateAction<boolean>>;
  setIsSuccessful?: Dispatch<SetStateAction<boolean>>;
  APIMethods: 'TOKEN' | 'FUNGIBLE' | 'NON_FUNFIBLE';
}

const TokenGeneralInfoModal = ({
  isOpen,
  onClose,
  tokenInfo,
  APIMethods,
  setTokenInfo,
  setShowToken,
  hederaNetwork,
  setParamValues,
  setIsSuccessful,
  initialParamValues,
  hederaTokenAddress,
}: PageProps) => {
  const commonBasicKeysTokenInfo = APIMethods === 'TOKEN' ? tokenInfo.token : tokenInfo.tokenInfo.token;

  const commonAdvancedKeysTokenInfo = APIMethods === 'TOKEN' ? tokenInfo : tokenInfo.tokenInfo;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        if (setTokenInfo) setTokenInfo({});
        if (setShowToken) setShowToken(false);
        if (setIsSuccessful) setIsSuccessful(false);
        if (setParamValues) setParamValues(initialParamValues);
      }}
      isCentered
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
          <TableContainer className="flex flex-col gap-3 overflow-x-hidden">
            <Table variant={HEDERA_CHAKRA_TABLE_VARIANTS.simple} size={HEDERA_CHAKRA_INPUT_BOX_SIZES.small}>
              <Tbody>
                {/* basic keys */}
                {TOKEN_INFO_BASIC_KEYS.map((key) => {
                  const keyToShow = convertCalmelCaseFunctionName(key);
                  const valueToShow = prepareInfoValuesToShow(key, commonBasicKeysTokenInfo);

                  return (
                    <Tr key={key}>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>{keyToShow}</Th>
                      <Td color={HEDERA_BRANDING_COLORS.violet} className="flex justify-end text-white">
                        {valueToShow}
                      </Td>
                    </Tr>
                  );
                })}

                {/* advanced keys */}
                {TOKEN_INFO_ADVANCED_KEYS.map((key) => {
                  const keyToShow = convertCalmelCaseFunctionName(key);
                  const valueToShow = prepareInfoValuesToShow(key, commonAdvancedKeysTokenInfo);

                  return (
                    <Tr key={key}>
                      <Th color={HEDERA_BRANDING_COLORS.violet}>{keyToShow}</Th>
                      <Td color={HEDERA_BRANDING_COLORS.violet} className="flex justify-end text-white">
                        {valueToShow}
                      </Td>
                    </Tr>
                  );
                })}

                {/* Fungible extra keys */}
                {APIMethods === 'FUNGIBLE' && (
                  <Tr>
                    <Th color={HEDERA_BRANDING_COLORS.violet}>Decimals</Th>
                    <Td color={HEDERA_BRANDING_COLORS.violet} className="flex justify-end text-white">
                      {tokenInfo.decimals.toString()}
                    </Td>
                  </Tr>
                )}

                {/* Non-Fungible extra keys */}
                {APIMethods === 'NON_FUNFIBLE' &&
                  TOKEN_INFO_NFT_KEYS.map((key) => {
                    const keyToShow = convertCalmelCaseFunctionName(key);
                    const valueToShow = prepareInfoValuesToShow(key, tokenInfo);
                    return (
                      <Tr key={key}>
                        <Th color={HEDERA_BRANDING_COLORS.violet}>{keyToShow}</Th>
                        <Td color={HEDERA_BRANDING_COLORS.violet} className="flex justify-end text-white">
                          {valueToShow}
                        </Td>
                      </Tr>
                    );
                  })}
              </Tbody>
            </Table>
          </TableContainer>

          {/* tip */}
          <p className="text-sm whitespace-normal pt-3">
            **note: For a more comprehensive view of this token&apos;s information,{' '}
            <Link
              href={`https://hashscan.io/${hederaNetwork}/token/${hederaTokenAddress}`}
              target="_blank"
              className=" text-hedera-purple underline"
            >
              explore it on HashScan
            </Link>
            .
          </p>
        </ModalBody>

        {/* footer */}
        <ModalFooter className="flex flex-col gap-3">
          <button
            onClick={() => {
              onClose();
              if (setTokenInfo) setTokenInfo({});
              if (setShowToken) setShowToken(false);
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

export default TokenGeneralInfoModal;
