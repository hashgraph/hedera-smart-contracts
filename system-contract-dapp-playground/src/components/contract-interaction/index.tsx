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
import { useCallback, useEffect, useState } from 'react';
import { deploySmartContract } from '@/api/hedera';
import ERC20DeployField from '../erc/ERCDeployField';
import HederaAlertDialog from '../common/AlertDialog';
import { HASHSCAN_BASE_URL } from '@/utils/constants';
import { convertAbiFunctionName } from '@/utils/helpers';
import { getHederaNativeIDFromEvmAddress } from '@/api/mirror-node';
import { HederaContractAsset, NetworkName } from '@/types/interfaces';
import { CommonErrorToast, NoWalletToast } from '../toast/CommonToast';
import { getInfoFromCookies, storeInfoInCookies } from '@/api/cookies';
import { Tabs, TabList, Tab, TabPanels, useToast, TabPanel } from '@chakra-ui/react';
import ExchangeRateDeployField from '../exchange-rate-hip-475/ExchangeRateDeployField';

interface PageProps {
  contract: HederaContractAsset;
}

const ContractInteraction = ({ contract }: PageProps) => {
  const toaster = useToast();
  const [contractId, setContractId] = useState('');
  const [isDeployed, setIsDeployed] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [network, setNetwork] = useState<NetworkName>();
  const [contractAddress, setContractAddress] = useState('');
  const [didDeployStart, setDidDeployStart] = useState(false);
  const [deployedParams, setDeployedParams] = useState<any>([]);
  const [displayConfirmDialog, setDisplayConfirmDialog] = useState(false);

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
      if (deployContractErr === '!HEDERA') {
        NoWalletToast({ toaster });
        return;
      }
      let errorMessage = "See client's console for more information";
      // @notice 4001 error code is returned when a metamask wallet request is rejected by the user
      // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
      if (JSON.stringify(deployContractErr).indexOf('4001') !== -1) {
        errorMessage = 'You have rejected the request.';
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
        description: "See client's console for more information",
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
          description: "See client's console for more information",
        });
        return;
      }

      if (contractAddr) {
        setIsDeployed(true);

        // update evm contract Address
        setContractAddress(contractAddr);
      }
      if (network) {
        setNetwork(JSON.parse(network) as NetworkName);
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
          network as NetworkName,
          'contracts'
        );
        // handle error
        if (getContractIdErr || !contractId) {
          CommonErrorToast({
            toaster,
            title: 'Cannot get Hedera navtive contract ID',
            description: "See client's console for more information",
          });
          return;
        }

        // update contract ID
        setContractId(contractId);
      }
    })();
  }, [network, contractAddress, toaster]);

  return (
    <Tabs
      variant="unstyle"
      isFitted
      isLazy
      className="bg-panel rounded-xl max-w-4xl text-white border border-white/30 shadow-2xl text-lg"
    >
      {isDeployed ? (
        <>
          {/* Tab headers */}
          <TabList
            mb="1em"
            className="overflow-x-scroll overflow-y-hidden no-scrollbar bg-secondary rounded-tl-xl rounded-tr-xl"
          >
            {contract.contractABI.map((abi, index) => {
              if (abi.type === 'function') {
                return (
                  <Tab
                    _selected={{ bg: '#374151', borderBottomWidth: '0' }}
                    className={`whitespace-nowrap first:border-l-0 py-4 border-b border-white/30 ${
                      index !== 0 && `border-l`
                    }`}
                    key={abi.name}
                  >
                    {convertAbiFunctionName(abi.name as string)}
                  </Tab>
                );
              }
            })}
          </TabList>

          {/* Tab body */}
          <TabPanels className="">
            {contract.contractABI.map((abi) => {
              if (abi.type === 'function') {
                return (
                  <TabPanel className={`whitespace-nowrap py-4`} key={abi.name}>
                    {/* Contract information */}
                    <div className="pb-6 flex flex-col gap-1 px-3">
                      <div className="flex gap-3 w-full justify-">
                        <p>Hedera contract ID: </p>
                        <Link
                          href={`${HASHSCAN_BASE_URL}/${network}/contract/${contractId}`}
                          target="_blank"
                          className="underline"
                        >
                          {contractId}
                        </Link>
                      </div>
                      <div className="flex gap-3 w-full justify-">
                        <p>Contract deployed to: </p>
                        <Link
                          href={`${HASHSCAN_BASE_URL}/${network}/contract/${contractId}`}
                          target="_blank"
                          className="underline"
                        >
                          {contractAddress}
                        </Link>
                      </div>
                    </div>

                    <hr className="border-white/30 w-full" />

                    {/* Contract assets */}
                    <div className="flex py-9 text-xl w-full h-full justify-center items-center">
                      {convertAbiFunctionName(abi.name as string)}
                    </div>
                  </TabPanel>
                );
              }
            })}
          </TabPanels>
        </>
      ) : (
        <div className=" min-h-[250px] flex justify-center items-center flex-col gap-6">
          <p>Let&apos;s get started by deploying this contract first!</p>

          {/* params if needed */}
          {contract.name === 'ExchangeRatePrecompile' ? (
            <ExchangeRateDeployField
              isDeploying={isDeploying}
              setDeployedParams={setDeployedParams}
              setDidDeployStart={setDidDeployStart}
            />
          ) : contract.name === 'ERC20Mock' || contract.name === 'ERC721Mock' ? (
            <ERC20DeployField
              isDeploying={isDeploying}
              setDeployedParams={setDeployedParams}
              setDidDeployStart={setDidDeployStart}
            />
          ) : (
            <>
              {/* deploy button */}
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
            </>
          )}
        </div>
      )}

      {/* Dialog */}
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
    </Tabs>
  );
};

export default ContractInteraction;
