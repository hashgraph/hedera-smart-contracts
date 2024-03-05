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
import Image from 'next/image';
import { Contract } from 'ethers';
import { BsTrash } from 'react-icons/bs';
import HederaPRNGMethods from './prng/methods';
import { FiExternalLink } from 'react-icons/fi';
import ERC20Methods from './erc/erc-20/methods';
import ERC721Methods from './erc/erc-721/methods';
import HederaIHRC719Methods from './ihrc/methods';
import { deploySmartContract } from '@/api/hedera';
import { useCallback, useEffect, useState } from 'react';
import { generateBaseContractInstance } from '@/api/ethers';
import ConfirmModal from '../common/components/ConfirmModal';
import ERC20DeployField from './erc/deployment/ERCDeployField';
import HederaExchangeRateMethods from './exchange-rate/methods';
import HederaAlertDialog from '../common/components/AlertDialog';
import { copyContentToClipboard } from '../common/methods/common';
import { IHederaContractAsset, TNetworkName } from '@/types/common';
import { getHederaNativeIDFromEvmAddress } from '@/api/mirror-node';
import { CommonErrorToast, NoWalletToast } from '../toast/CommonToast';
import { convertCalmelCaseFunctionName } from '@/utils/common/helpers';
import HederaTokenCreateMethods from './hts/token-create-custom/methods';
import HederaTokenQueryMethods from './hts/token-query-contract/methods';
import HederaTokenTransferMethods from './hts/token-transfer-contract/method';
import HederaTokenManagementMethods from './hts/token-management-contract/methods';
import { getInfoFromCookies, removeCookieAt, storeInfoInCookies } from '@/api/cookies';
import {
  Tab,
  Tabs,
  TabList,
  Popover,
  Tooltip,
  TabPanel,
  useToast,
  TabPanels,
  useDisclosure,
  PopoverContent,
  PopoverTrigger,
} from '@chakra-ui/react';
import {
  CONTRACT_NAMES,
  HASHSCAN_BASE_URL,
  OFFCIAL_NETWORK_NAME,
  HEDERA_BRANDING_COLORS,
  HEDERA_CHAKRA_TABLE_VARIANTS,
  HEDERA_COMMON_WALLET_REVERT_REASONS,
  CONTRACT_NAME_TO_STORAGE_KEY_VALUE,
} from '@/utils/common/constants';

interface PageProps {
  contract: IHederaContractAsset;
}

const ContractInteraction = ({ contract }: PageProps) => {
  const toaster = useToast();
  const [mounted, setMounted] = useState(false);
  const [contractId, setContractId] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeployed, setIsDeployed] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [network, setNetwork] = useState<TNetworkName>();
  const [contractAddress, setContractAddress] = useState('');
  const [didDeployStart, setDidDeployStart] = useState(false);
  const [baseContract, setBaseContract] = useState<Contract>();
  const [deployedParams, setDeployedParams] = useState<any>([]);
  const [displayConfirmDialog, setDisplayConfirmDialog] = useState(false);

  // handle set up baseContract
  useEffect(() => {
    (async () => {
      if (contractAddress) {
        const { baseContract, err: baseContractErr } = await generateBaseContractInstance(
          contractAddress,
          contract.contractABI
        );

        // handle error
        if (baseContractErr || !baseContract) {
          if (baseContractErr === `!${OFFCIAL_NETWORK_NAME}`) {
            NoWalletToast({ toaster });
            return;
          }

          CommonErrorToast({
            toaster,
            title: 'Cannot deploy contract',
            description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
          });
          return;
        }

        // update baseContract state
        setBaseContract(baseContract);
      }
    })();
  }, [contract.contractABI, contractAddress, toaster]);

  /** @dev handle deploying contract */
  const handleDeployContract = useCallback(async () => {
    setIsDeploying(true);
    const { contractAddress, err: deployContractErr } = await deploySmartContract(
      contract.contractABI,
      contract.contractBytecode,
      deployedParams
    );
    setIsDeploying(false);

    // handle error
    if (deployContractErr || !contractAddress) {
      if (deployContractErr === `!${OFFCIAL_NETWORK_NAME}`) {
        NoWalletToast({ toaster });
        return;
      }
      let errorMessage = HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description;
      if (JSON.stringify(deployContractErr).indexOf(HEDERA_COMMON_WALLET_REVERT_REASONS.REJECT.code) !== -1) {
        errorMessage = HEDERA_COMMON_WALLET_REVERT_REASONS.REJECT.description;
      }
      CommonErrorToast({
        toaster,
        title: 'Cannot deploy contract',
        description: errorMessage,
      });
      return;
    }

    // store contract assets in Cookies
    const cookieErr = storeInfoInCookies(contract.name, contractAddress);
    if (cookieErr) {
      CommonErrorToast({
        toaster,
        title: 'Error storing contract assets to Cookies',
        description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
      });
      return;
    }

    // udpate states
    setDisplayConfirmDialog(true);
    setContractAddress(contractAddress);
  }, [contract.contractABI, contract.contractBytecode, contract.name, deployedParams, toaster]);

  // handle deploying contract for ExchangeRate, ERC20Mock, and ERC721Mock contracts
  useEffect(() => {
    if (didDeployStart && deployedParams.length > 0) {
      handleDeployContract();
    }
  }, [didDeployStart, deployedParams, handleDeployContract]);

  // retrieve contract address from Cookies to make sure contract has already been deployed
  useEffect(() => {
    (async () => {
      const { value: contractAddr, error: cookieErr } = getInfoFromCookies(contract.name);
      const { value: network, error: networkErr } = getInfoFromCookies('_network');
      // handle error
      if (cookieErr || networkErr) {
        CommonErrorToast({
          toaster,
          title: 'Error storing contract assets to Cookies',
          description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
        });
        return;
      }

      if (contractAddr) {
        setIsDeployed(true);

        // update evm contract Address
        setContractAddress(contractAddr);
      }
      if (network) {
        setNetwork(JSON.parse(network) as TNetworkName);
      }
    })();
  }, [contract.name, toaster]);

  // update contractId state
  useEffect(() => {
    (async () => {
      if (network && contractAddress) {
        // handle getting Hedera native contractId from EvmAddress
        const { contractId, err: getContractIdErr } = await getHederaNativeIDFromEvmAddress(
          contractAddress,
          network as TNetworkName,
          'contracts'
        );
        // handle error
        if (getContractIdErr || !contractId) {
          CommonErrorToast({
            toaster,
            title: 'Cannot get Hedera navtive contract ID',
            description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
          });
          return;
        }

        // update contract ID
        setContractId(contractId);
      }
    })();
  }, [network, contractAddress, toaster]);

  // handle removing contract instance
  const handleRemoveContractInstance = () => {
    // close the modal
    onClose();

    // remove contract record in cookies
    removeCookieAt(contract.name);

    // reset states
    setContractId('');
    setIsDeployed(false);
    setContractAddress('');
    setBaseContract(undefined);
  };

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Tabs
      variant={HEDERA_CHAKRA_TABLE_VARIANTS.unstyled}
      isFitted
      isLazy
      className="bg-panel rounded-xl max-w-4xl text-white border border-white/30 shadow-2xl text-lg"
    >
      {/* @notice TokenAssociation IHRC719 does not need to deploy */}
      {isDeployed || contract.name === CONTRACT_NAMES.IHRC719 ? (
        <>
          {/* Tab headers */}
          <TabList
            mb="1em"
            className="overflow-x-scroll overflow-y-hidden no-scrollbar bg-secondary rounded-tl-xl rounded-tr-xl"
          >
            {contract.methods.map((method, index) => {
              if (
                contract.name === 'TokenTransferContract' &&
                method === 'crypto' &&
                network !== 'localnet'
              ) {
                return null;
              } else {
                return (
                  <Tab
                    _selected={{ bg: HEDERA_BRANDING_COLORS.panel, borderBottomWidth: '0' }}
                    className={`whitespace-nowrap first:border-l-0 py-4 border-b border-white/30 ${
                      index !== 0 && `border-l`
                    }`}
                    key={method}
                  >
                    {convertCalmelCaseFunctionName(method)}
                  </Tab>
                );
              }
            })}
          </TabList>

          {/* Tab body */}
          <TabPanels>
            {contract.methods.map((method) => {
              return (
                <TabPanel className={`whitespace-nowrap py-4`} key={method}>
                  {/* Contract information - not for IHRC719Contract*/}
                  {contract.name !== CONTRACT_NAMES.IHRC719 && (
                    <>
                      <div className="pb-6 flex flex-col gap-1 px-3 relative">
                        {/* remove contract instance button */}
                        <div className="absolute right-3 -top-3">
                          <Tooltip label="Remove this contract instance" placement="top">
                            <button
                              onClick={onOpen}
                              className={`border border-white/30 p-2 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
                            >
                              <BsTrash />
                            </button>
                          </Tooltip>
                        </div>

                        {/* Contract ID */}
                        <div className="flex gap-3 w-full justify-">
                          <p>Hedera contract ID: </p>
                          <div className="flex items-center gap-1">
                            <div
                              className="cursor-pointer"
                              onClick={() => copyContentToClipboard(contractId)}
                            >
                              <Popover>
                                <PopoverTrigger>
                                  <div className="flex gap-1 items-center">
                                    <Tooltip label="click to copy contract ID">
                                      <p>{contractId}</p>
                                    </Tooltip>
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent width={'fit-content'} border={'none'}>
                                  <div className="bg-secondary px-3 py-2 border-none font-medium text-base">
                                    Copied
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <Tooltip
                              label={'Explore this contract on HashScan'}
                              placement="top"
                              fontWeight={'medium'}
                            >
                              <Link
                                href={`${HASHSCAN_BASE_URL}/${network}/contract/${contractId}`}
                                target="_blank"
                              >
                                <FiExternalLink />
                              </Link>
                            </Tooltip>
                          </div>
                        </div>

                        {/* EVM contract address */}
                        <div className="flex gap-3 w-full justify-">
                          <p>Contract deployed to: </p>
                          <div className="flex items-center gap-1">
                            <div
                              className="cursor-pointer"
                              onClick={() => copyContentToClipboard(contractAddress)}
                            >
                              <Popover>
                                <PopoverTrigger>
                                  <div className="flex gap-1 items-center">
                                    <Tooltip label="click to copy contract address">
                                      <p>{contractAddress}</p>
                                    </Tooltip>
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent width={'fit-content'} border={'none'}>
                                  <div className="bg-secondary px-3 py-2 border-none font-medium text-base">
                                    Copied
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            <Tooltip
                              label={'Explore this contract on HashScan'}
                              placement="top"
                              fontWeight={'medium'}
                            >
                              <Link
                                href={`${HASHSCAN_BASE_URL}/${network}/contract/${contractId}`}
                                target="_blank"
                              >
                                <FiExternalLink />
                              </Link>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                      <hr className="border-white/30 w-full" />
                    </>
                  )}

                  {/* Contract methods */}
                  <div className="flex py-9 text-xl w-full h-full justify-center items-center">
                    {/* HTS Token Create */}
                    {contract.name === CONTRACT_NAMES.TOKEN_CREATE && (
                      <HederaTokenCreateMethods method={method} baseContract={baseContract! as Contract} />
                    )}

                    {/* HTS Token Management*/}
                    {contract.name === CONTRACT_NAMES.TOKEN_MANAGE && (
                      <HederaTokenManagementMethods
                        method={method}
                        baseContract={baseContract! as Contract}
                      />
                    )}

                    {/* HTS Token Query*/}
                    {contract.name === CONTRACT_NAMES.TOKEN_QUERY && (
                      <HederaTokenQueryMethods method={method} baseContract={baseContract! as Contract} />
                    )}

                    {/* HTS Token Transfer*/}
                    {contract.name === CONTRACT_NAMES.TOKEN_TRANSFER && (
                      <HederaTokenTransferMethods method={method} baseContract={baseContract! as Contract} />
                    )}

                    {/* IHRC719 contract */}
                    {contract.name === CONTRACT_NAMES.IHRC719 && (
                      <HederaIHRC719Methods network={network as string} />
                    )}

                    {/* HRC contract */}
                    {contract.name === CONTRACT_NAMES.PRNG && (
                      <HederaPRNGMethods baseContract={baseContract! as Contract} />
                    )}

                    {/* Exchange Rate */}
                    {contract.name === 'ExchangeRatePrecompile' && (
                      <HederaExchangeRateMethods baseContract={baseContract! as Contract} />
                    )}

                    {/* ERC-20 */}
                    {contract.name === CONTRACT_NAMES.ERC20 && (
                      <ERC20Methods method={method} baseContract={baseContract! as Contract} />
                    )}

                    {/* ERC-721 */}
                    {contract.name === CONTRACT_NAMES.ERC721 && (
                      <ERC721Methods method={method} baseContract={baseContract! as Contract} />
                    )}
                  </div>
                </TabPanel>
              );
            })}
          </TabPanels>
        </>
      ) : (
        <>
          {/* For contracts that need params to deploy */}
          <div className=" min-h-[250px] flex justify-center items-center flex-col gap-6">
            <p>Let&apos;s get started by deploying this contract first!</p>

            {(contract.name === CONTRACT_NAMES.ERC20 || contract.name === CONTRACT_NAMES.ERC721) && (
              <ERC20DeployField
                isDeploying={isDeploying}
                setDeployedParams={setDeployedParams}
                setDidDeployStart={setDidDeployStart}
              />
            )}

            {contract.name !== CONTRACT_NAMES.ERC20 && contract.name !== CONTRACT_NAMES.ERC721 && (
              <button
                onClick={handleDeployContract}
                disabled={isDeploying}
                className={`border border-hedera-green text-hedera-green px-6 py-2 rounded-xl font-medium hover:bg-hedera-green/50 hover:text-white transition duration-300 ${
                  isDeploying && `cursor-not-allowed`
                }`}
              >
                {isDeploying ? (
                  <div className="flex gap-3">
                    Deploying...
                    <Image
                      src={'/brandings/hedera-logomark.svg'}
                      alt={'hedera-logomark'}
                      width={15}
                      height={15}
                      className="animate-bounce"
                    />
                  </div>
                ) : (
                  'Deploy'
                )}
              </button>
            )}
          </div>
        </>
      )}

      {/* Congrats Dialog */}
      {displayConfirmDialog && (
        <HederaAlertDialog
          isOpen={displayConfirmDialog}
          setIsOpen={setDisplayConfirmDialog}
          alertTitle={'🎉 Deploy contract successfully 🎊'}
          alertMsg={
            <>
              <p>Your new contract has been created at this address:</p>
              <Link
                href={`${HASHSCAN_BASE_URL}/${network}/contract/${contractId}`}
                target="_blank"
                className="text-hedera-purple underline"
              >
                {contractAddress}
              </Link>
            </>
          }
          confirmBtnTitle={'Acknowledge'}
          confirmCallBack={() => setIsDeployed(true)}
        />
      )}

      {/* remove current contract intance modal */}
      <ConfirmModal
        isOpen={isOpen}
        onClose={onClose}
        modalBody={
          <p className="text-white/70">
            By completing this action, the current contract instance and all the transactions you have made
            against this contract will be permanently erased from the DApp&apos;s cache, but they will still
            be accessible through HashScan or other explorer solutions.
          </p>
        }
        modalHeader={'Sure to remove contract instance?'}
        handleAcknowledge={handleRemoveContractInstance}
      />
    </Tabs>
  );
};

export default ContractInteraction;
