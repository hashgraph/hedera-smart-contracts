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
import { ethers } from 'ethers';
import { clearCookies } from '@/api/cookies';
import { TNetworkName } from '@/types/common';
import { BiCopy, BiCheckDouble } from 'react-icons/bi';
import ConfirmModal from '../common/components/ConfirmModal';
import { clearCachedTransactions } from '@/api/localStorage';
import { getBalance, getWalletProvider } from '@/api/wallet';
import { copyContentToClipboard } from '../common/methods/common';
import { getHederaNativeIDFromEvmAddress } from '@/api/mirror-node';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CommonErrorToast, NoWalletToast } from '../toast/CommonToast';
import { SkeletonText, useDisclosure, useToast } from '@chakra-ui/react';
import { BsChevronDown, BsFillQuestionOctagonFill } from 'react-icons/bs';
import { HASHSCAN_BASE_URL, HEDERA_COMMON_WALLET_REVERT_REASONS } from '@/utils/common/constants';

interface PageProps {
  network: TNetworkName;
  userAddress: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const WalletPopup = ({ setIsOpen, userAddress, network }: PageProps) => {
  const toaster = useToast();
  const [isCopied, setIsCopied] = useState({
    accountId: false,
    evmAddress: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [accountBalance, setAccountBalance] = useState<String>();
  const [hederaAccountId, setHederaAccountId] = useState<String>();
  const { walletProvider, err: walletProviderErr } = getWalletProvider();

  /**
   * @dev loading user balance
   *
   * @dev loading user Hedera native accountId
   */
  useEffect(() => {
    // handle walletObject or walletProvider being null by toasting it out on the client
    if (walletProviderErr === '!HEDERA' || !walletProvider) {
      NoWalletToast({ toaster });
      return;
    }

    (async () => {
      // handle get account balance
      const { balance, err: getBalanceErr } = await getBalance(walletProvider, userAddress);
      // handle error
      if (getBalanceErr || !balance) {
        CommonErrorToast({
          toaster,
          title: 'Cannot get account balance',
          description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
        });
        return;
      }

      // handle updating balance state
      setAccountBalance(`${Number(ethers.formatEther(balance)).toFixed(4)} ℏ`);

      // handle getting Hedera native accountId from EvmAddress
      const { accountId, err: getAccountIdErr } = await getHederaNativeIDFromEvmAddress(
        userAddress,
        network,
        'accounts'
      );
      // handle error
      if (getAccountIdErr || !accountId) {
        CommonErrorToast({
          toaster,
          title: 'Cannot get account id',
          description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
        });
        return;
      }

      // handle updating accoundId state
      setHederaAccountId(accountId);
    })();
  }, [userAddress, network, toaster, walletProvider, walletProviderErr]);

  /** @dev copy content to clipboard */
  const copyWalletAddress = (type: 'ACCOUNTID' | 'EVMADDR') => {
    switch (type) {
      case 'ACCOUNTID':
        setIsCopied((prev) => ({ ...prev, accountId: true }));
        copyContentToClipboard(hederaAccountId as string);
        break;
      default:
        setIsCopied((prev) => ({ ...prev, evmAddress: true }));
        copyContentToClipboard(userAddress);
    }
    setTimeout(() => {
      setIsCopied({ accountId: false, evmAddress: false });
    }, 2000);
  };

  /**
   * @dev disconnect user
   */
  const handleDisconnect = async () => {
    // close modal
    onClose();

    // clear Cookies cache
    await clearCookies();

    // clear localStorage cache
    clearCachedTransactions();

    // redirect user to landing page
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="w-screen h-screen inset-0 fixed flex justify-center items-center z-50">
      {/* Overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className="w-screen h-screen inset-0 fixed bg-white/10 dark:bg-black/10 backdrop-blur-lg"
      />
      <div
        className="h-fit flex flex-col gap-3 rounded-xl drop-shadow-xl
                    bg-secondary text-white font-styrene w-[30rem]"
      >
        <div className=" flex flex-col items-center py-3 gap-4 mx-6">
          {/* Hedera network */}
          <p className="text-2xl">Hedera</p>

          {/* network dropdown */}
          <div className="flex bg-button text-white w-full border-[1px] border-white/50 hover:bg-transparent justify-center rounded-xl cursor-pointer">
            <div className="flex justify-center text-lg items-center gap-1 py-2">
              {network}
              <BsChevronDown />
            </div>
          </div>

          {/* Account information */}
          <div className="w-full flex flex-col gap-3">
            {/* AccountID */}
            <div className="flex justify-between">
              {/* title */}
              <div className="flex gap-1 items-center relative">
                <p>Account ID:</p>
                <div className="cursor-pointer">
                  <BsFillQuestionOctagonFill />
                </div>
              </div>
              {/* value */}
              <div
                onClick={() => {
                  copyWalletAddress('ACCOUNTID');
                }}
                className="flex gap-1 items-center cursor-pointer"
              >
                <div>
                  {hederaAccountId || <SkeletonText mt="4" w="20" noOfLines={1} skeletonHeight="2" />}
                </div>
                {isCopied.accountId ? (
                  <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                    <BiCheckDouble />
                  </div>
                ) : (
                  <div className="transition transform hover:scale-125 w-[1rem] text-wrapperText-light dark:text-headers-dark">
                    <BiCopy />
                  </div>
                )}
              </div>
            </div>

            {/* EVM address */}
            <div className="flex justify-between">
              {/* title */}
              <div className="flex gap-1 items-center">
                <p>EVM Address:</p>
                <div className="cursor-pointer">
                  <BsFillQuestionOctagonFill />
                </div>
              </div>
              {/* value */}
              <div
                onClick={() => {
                  copyWalletAddress('EVMADDR');
                }}
                className="flex gap-1 items-center cursor-pointer"
              >
                <p>
                  {userAddress.slice(0, 7)}...{userAddress.slice(-5)}
                </p>
                {isCopied.evmAddress ? (
                  <div className="w-[1rem] text-textaccents-light dark:text-textaccents-dark">
                    <BiCheckDouble />
                  </div>
                ) : (
                  <div className="transition transform hover:scale-125 w-[1rem] text-wrapperText-light dark:text-headers-dark">
                    <BiCopy />
                  </div>
                )}
              </div>
            </div>

            {/* Balance */}
            <div className="flex justify-between items-center">
              {/* title */}
              <p>Balance:</p>
              {/* value */}
              <div>{accountBalance || <SkeletonText mt="4" w="20" noOfLines={1} skeletonHeight="2" />}</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3 pb-3">
            <div className="flex w-full gap-2">
              {/* Explore */}
              <Link
                href={`${HASHSCAN_BASE_URL}/${network}/address/${userAddress}`}
                target="_blank"
                className="flex flex-col items-center py-1 bg-button text-white w-full border-[1px] border-white/50 hover:bg-transparent justify-center rounded-xl cursor-pointer focus:outline-none"
              >
                <Image src={'/assets/icons/hashscan-icon.png'} alt={''} width={15} height={15} />
                <p className="flex justify-center text-sm items-center gap-1 py-2 leading-[.5rem]">
                  Explore Account
                </p>
              </Link>

              {/* Activity */}
              <Link
                href={'/activity'}
                className="flex flex-col items-center py-1 bg-button text-white w-full border-[1px] border-white/50 hover:bg-transparent justify-center rounded-xl cursor-pointer"
              >
                <Image src={'/assets/icons/list-icon.png'} alt={''} width={15} height={15} />
                <p className="flex justify-center text-sm items-center gap-1 py-2 leading-[.5rem]">
                  Activity
                </p>
              </Link>

              {/* Disconnect */}
            </div>
            <button
              onClick={() => {
                onOpen();
              }}
              className="flex flex-col items-center py-1 px-4 bg-button text-white w-full border-[1px] border-white/50 hover:bg-transparent justify-center rounded-xl cursor-pointer"
            >
              <Image src={'/assets/icons/disconnect-icon.png'} alt={''} width={15} height={15} />
              <p className="flex justify-center text-sm items-center gap-1 py-2 leading-[.5rem]">
                Disconnect
              </p>
            </button>

            <ConfirmModal
              isOpen={isOpen}
              onClose={onClose}
              modalBody={
                <p className="text-white/70">
                  By completing this action, all the deployed smart contract instances and all the
                  transactions you have made during this session will be permanently erased from the
                  DApp&apos;s cache, but they will still be accessible through HashScan or other explorer
                  solutions.
                </p>
              }
              modalHeader={'Sure to disconnect?'}
              handleAcknowledge={handleDisconnect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPopup;
