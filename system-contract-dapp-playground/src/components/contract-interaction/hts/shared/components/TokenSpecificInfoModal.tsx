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
import { Dispatch, SetStateAction } from 'react';
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
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  ModalContent,
  TableContainer,
  ModalCloseButton,
} from '@chakra-ui/react';
import {
  EXPIRY_KEYS,
  KEY_VALUE_KEYS,
  FIXED_FEES_KEYS,
  CUSTOM_FEES_KEYS,
  FRACTIONAL_FEES_KEYS,
} from '@/utils/contract-interactions/HTS/token-query/constant';

interface PageProps {
  APIMethods:
    | 'TOKEN_TYPE'
    | 'TOKEN_KEYS'
    | 'CUSTOM_FEES'
    | 'TOKEN_EXPIRY'
    | 'DEFAULT_KYC_STATUS'
    | 'DEFAULT_FREEZE_STATUS';
  tokenInfo: any;
  isOpen: boolean;
  onClose: () => void;
  hederaNetwork: string;
  initialParamValues?: any;
  hederaTokenAddress: string;
  setTokenInfo?: Dispatch<any>;
  setParamValues?: Dispatch<any>;
  keyType?: IHederaTokenServiceKeyType;
  setIsSuccessful?: Dispatch<SetStateAction<boolean>>;
  setKeyType?: Dispatch<SetStateAction<IHederaTokenServiceKeyType>>;
}

const TokenSpecificInfoModal = ({
  isOpen,
  onClose,
  keyType,
  tokenInfo,
  setKeyType,
  APIMethods,
  setTokenInfo,
  hederaNetwork,
  setParamValues,
  setIsSuccessful,
  initialParamValues,
  hederaTokenAddress,
}: PageProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        if (setTokenInfo) setTokenInfo({});
        if (setKeyType) setKeyType('ADMIN');
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
                {APIMethods === 'TOKEN_KEYS' && (
                  <Tr>
                    <Th color={HEDERA_BRANDING_COLORS.violet}>KEY TYPE</Th>
                    <Td className="flex justify-end">{keyType}</Td>
                  </Tr>
                )}

                {(APIMethods === 'DEFAULT_FREEZE_STATUS' || APIMethods === 'DEFAULT_KYC_STATUS') && (
                  <Tr>
                    <Th color={HEDERA_BRANDING_COLORS.violet}>{APIMethods}</Th>
                    <Td className="flex justify-end">{JSON.stringify(tokenInfo).toUpperCase()}</Td>
                  </Tr>
                )}

                {APIMethods === 'TOKEN_TYPE' && (
                  <Tr>
                    <Th color={HEDERA_BRANDING_COLORS.violet}>{APIMethods}</Th>
                    <Td className="flex justify-end">{tokenInfo}</Td>
                  </Tr>
                )}

                {APIMethods === 'CUSTOM_FEES' && (
                  <>
                    {CUSTOM_FEES_KEYS.map((key) => (
                      <>
                        {(() => {
                          let keysArray = [] as string[];
                          if (key === 'fixedFees') {
                            keysArray = FIXED_FEES_KEYS;
                          } else if (key === 'fractionalFees') {
                            keysArray = FRACTIONAL_FEES_KEYS;
                          } else {
                            keysArray = EXPIRY_KEYS;
                          }

                          return (
                            <>
                              {tokenInfo[key].length > 0 ? (
                                tokenInfo[key].map((fixedFee: any, index: number) => {
                                  return (
                                    <>
                                      {keysArray.map((feeKey) => {
                                        const keyToShow = convertCalmelCaseFunctionName(feeKey);
                                        const valueToShow = prepareInfoValuesToShow(feeKey, fixedFee);
                                        return (
                                          <Tr key={feeKey}>
                                            <Th color={HEDERA_BRANDING_COLORS.violet} className="">
                                              {tokenInfo.fixedFees.length > 1
                                                ? `${keyToShow}-${index + 1}`
                                                : keyToShow}
                                            </Th>
                                            <Td className="flex justify-end text-white">{valueToShow}</Td>
                                          </Tr>
                                        );
                                      })}
                                    </>
                                  );
                                })
                              ) : (
                                <>
                                  {FIXED_FEES_KEYS.map((key) => {
                                    const keyToShow = convertCalmelCaseFunctionName(key);
                                    const valueToShow = prepareInfoValuesToShow(key, null);
                                    return (
                                      <Tr key={key}>
                                        <Th color={HEDERA_BRANDING_COLORS.violet} className="">
                                          {keyToShow}
                                        </Th>
                                        <Td className="flex justify-end text-white">{valueToShow}</Td>
                                      </Tr>
                                    );
                                  })}
                                </>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ))}
                  </>
                )}

                {(APIMethods === 'TOKEN_EXPIRY' || APIMethods === 'TOKEN_KEYS') && (
                  <>
                    {(() => {
                      let keyArray = APIMethods === 'TOKEN_EXPIRY' ? EXPIRY_KEYS : KEY_VALUE_KEYS;
                      return (
                        <>
                          {keyArray.map((key) => {
                            const keyToShow = convertCalmelCaseFunctionName(key);
                            const valueToShow = prepareInfoValuesToShow(key, tokenInfo);
                            return (
                              <Tr key={key}>
                                <Th color={HEDERA_BRANDING_COLORS.violet} className="">
                                  {keyToShow}
                                </Th>
                                <Td className="flex justify-end text-white">{valueToShow}</Td>
                              </Tr>
                            );
                          })}
                        </>
                      );
                    })()}
                  </>
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {/* tip */}
          <p className="text-sm whitespace-normal pt-3">
            **Note: For a more comprehensive view of this token&apos;s information,{' '}
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
              if (setKeyType) setKeyType('ADMIN');
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

export default TokenSpecificInfoModal;
