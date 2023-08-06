'use client';

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
import { motion } from 'framer-motion';
import WalletPopup from '../wallet-popup';
import { useToast } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { BsChevronDown } from 'react-icons/bs';
import { isProtectedRoute } from '@/utils/helpers';
import { loadAccountsFromCookies } from '@/api/cookies';
import { CommonErrorToast } from '../toast/CommonToast';
import { navVariants } from '@/libs/framer-motion/variants';
import { SetStateAction, useEffect, useState } from 'react';

const Navbar = () => {
  // local states
  const toaster = useToast();
  const pathname = usePathname();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [didWalletPop, setDidWalletPop] = useState(false);

  // listen to pathname change event to retrieve account information cookies
  useEffect(() => {
    if (isProtectedRoute(pathname)) {
      // retrieve account info from cookies
      const accountsInfo = loadAccountsFromCookies();

      // just best pratice to handle error as this would rarely happen as we have already gated all the checks in middleware.js
      if (!accountsInfo.isConnected || !accountsInfo.accounts || accountsInfo.error) {
        CommonErrorToast({
          toaster,
          title: 'Error retrieving account information',
          description: 'Unknown error appeared...',
        });
        return;
      }

      // update states
      setAccounts(JSON.parse(accountsInfo.accounts));
      setIsConnected(JSON.parse(accountsInfo.isConnected));
    }
  }, [pathname]);

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      whileInView="show"
      className="px-6 pt-6 sm:px-16 md:px-24 md:pt-9 flex justify-between items-center w-full z-50"
    >
      {/* Protected Navbar */}
      {isConnected ? (
        <div className="grid grid-rows-2 sm:grid-cols-2 lg:grid-cols-3 w-full justify-center gap-3">
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
              <Image
                src={'/brandings/hedera-logomark.svg'}
                alt={'hedera-logomark'}
                width={30}
                height={30}
              />

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
        <>
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
        </>
      )}

      {didWalletPop && (
        <WalletPopup isOpen={didWalletPop} setIsOpen={setDidWalletPop} userAddress={accounts[0]} />
      )}
    </motion.nav>
  );
};

export default Navbar;
