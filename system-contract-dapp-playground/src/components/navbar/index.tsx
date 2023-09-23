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

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import WalletPopup from '../wallet-popup';
import { useToast } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { TNetworkName } from '@/types/common';
import { usePathname } from 'next/navigation';
import { BsChevronDown } from 'react-icons/bs';
import { CommonErrorToast } from '../toast/CommonToast';
import { isProtectedRoute } from '@/utils/common/helpers';
import { loadAccountInfoFromCookies } from '@/api/cookies';
import { navVariants } from '@/libs/framer-motion/variants';
import { HEDERA_COMMON_WALLET_REVERT_REASONS } from '@/utils/common/constants';

const Navbar = () => {
  // local states
  const toaster = useToast();
  const pathname = usePathname();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [didWalletPop, setDidWalletPop] = useState(false);
  const [network, setNetwork] = useState<TNetworkName>('testnet');

  // listen to pathname change event to retrieve account information cookies
  useEffect(() => {
    if (isProtectedRoute(pathname)) {
      // retrieve account info from cookies
      const accountsInfo = loadAccountInfoFromCookies();

      // just best pratice to handle error as this would rarely happen as we have already gated all the checks in middleware.js
      if (
        !accountsInfo.isConnected ||
        !accountsInfo.accounts ||
        !accountsInfo.network ||
        accountsInfo.error
      ) {
        CommonErrorToast({
          toaster,
          title: 'Error retrieving account information',
          description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
        });
        return;
      }

      // update states
      setAccounts(JSON.parse(accountsInfo.accounts));
      setIsConnected(JSON.parse(accountsInfo.isConnected));
      setNetwork(JSON.parse(accountsInfo.network) as TNetworkName);
    }
  }, [pathname, toaster]);

  return (
    <motion.nav
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{
        delay: 0.3,
        duration: 0.3,
      }}
      viewport={{ once: true }}
      className="px-6 pt-6 flex flex-col justify-between items-center z-50"
    >
      {/* Protected Navbar */}
      {isConnected ? (
        <div className="grid grid-rows-2 sm:grid-rows-1 sm:grid-cols-2 lg:grid-cols-3 w-full justify-center gap-3 pb-6">
          {/* Logo */}
          <Link href={'/'} className="flex gap-3 items-center justify-center sm:justify-start">
            <Image
              src={'/brandings/hedera-logomark.svg'}
              alt={'hedera-logomark'}
              width={50}
              height={50}
              className="z-50"
            />
            <p className="text-white text-[2rem]">Hedera</p>
          </Link>

          {/* DApp playground */}
          <div className="hidden lg:flex lg:gap-1 lg:items-center lg:justify-center">
            <div className="flex justify-center items-center text-hedera-green">
              <div className="rounded-r-[9px] border-hedera-green w-[52px] h-[27px] border-[5px] mt-1" />
              <div className="font-medium text-[2rem] uppercase">App</div>
            </div>

            {/* Playground */}
            <div className="uppercase text-[2rem] bg-clip-text text-white">Playground</div>
          </div>

          {/* wallet info */}
          <div className="text-white flex justify-end">
            {/* wallet wrapper */}
            <div
              className="bg-gradient-to-r from-hedera-gradient-2-lime/60 to-hedera-gradient-2-teal rounded-lg flex items-center px-3 cursor-pointer"
              onClick={() => {
                setDidWalletPop(true);
              }}
            >
              {/* logo */}
              <Image src={'/brandings/hedera-logomark.svg'} alt={'hedera-logomark'} width={30} height={30} />

              {/* vertical bar */}
              <div className="bg-white/30 w-[1px] h-full mx-3" />

              {/* address */}
              <p className="text-lg font-medium">
                {accounts[0].slice(0, 7)}...{accounts[0].slice(-5)}
              </p>

              {/* downward arrow */}
              <div className="text-xl ml-1">
                <BsChevronDown />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          variants={navVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex justify-between w-full"
        >
          {/* Unprotected Navbar */}
          <Link href={'/'}>
            {/* Logo */}
            <Image
              src={'/brandings/hedera-logomark.svg'}
              alt={'hedera-logomark'}
              width={50}
              height={50}
              className="z-50"
            />
          </Link>

          {/* Text logo */}
          <p className="text-white text-[2rem]">Hedera</p>
        </motion.div>
      )}

      {isConnected && <hr className="w-[99vw] border-t border-white/40" />}

      {didWalletPop && (
        <WalletPopup network={network} userAddress={accounts[0]} setIsOpen={setDidWalletPop} />
      )}
    </motion.nav>
  );
};

export default Navbar;
