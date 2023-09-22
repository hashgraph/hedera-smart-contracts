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
import { motion } from 'framer-motion';
import { NAV_SIDE_BAR_ITEMS } from '@/utils/common/constants';

const OverviewSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{
        delay: 0.3,
        duration: 0.6,
      }}
      viewport={{ once: true }}
      className="text-white w-full flex pt-7 pl-7 flex-col gap-9 min-w-[70rem]"
    >
      {/* top part */}
      <div className="flex flex-col gap-6">
        {/* Overview */}
        <h2 className="text-[1.88rem] font-medium leading-10">Overview</h2>

        {/* Hedera Network */}
        <div>
          {/* Title */}
          <div className="text-[1.65rem] font-medium">Hedera Network</div>

          {/* content */}
          <div className="tracking-tight text-white/70">
            Hedera is a fully open source public distributed ledger that utilizes the fast, fair, and secure
            hashgraph consensus. Its network services include Solidity-based smart contracts, as well as
            native tokenization and consensus services used to build decentralized applications. Learn more
            about{' '}
            <Link
              href={'https://hedera.com/'}
              target="_blank"
              className="underline text-hedera-purple font-normal"
            >
              Hedera network
            </Link>
            !
          </div>
        </div>

        {/* Hedera Smart Contract Library */}
        <div>
          {/* title */}
          <div className="text-[1.65rem] font-medium">Hedera Smart Contract Library</div>
          {/* content */}
          <div className="tracking-tight text-white/70">
            Seamlessly scale your projects using Solidity smart contracts on Hedera, taking advantage of its
            unparalleled efficiency. Curious to explore the inner workings of smart contracts hosted on Dapp
            Playground? The source code for{' '}
            <Link
              href={'https://github.com/hashgraph/hedera-smart-contracts'}
              target="_blank"
              className="underline text-hedera-purple font-normal"
            >
              Hedera smart contract library
            </Link>{' '}
            is readily available on Github, awaiting your delve into its intricacies.
          </div>
        </div>
      </div>

      {/* break line */}
      <hr className="border-t border-white/40" />

      {/* bottom part */}
      <div className="flex flex-col gap-12 pb-9">
        {/* DApp Playground */}
        <div>
          {/* title */}
          <h1 className="text-[1.88rem] font-medium leading-10">DApp Playground</h1>
          {/* content */}
          <div className="tracking-tight text-white/70">
            An intuitively designed interface aimed at highlighting the capabilities of Hedera Network&apos;s
            system contracts. This revolutionary platform empowers developers to effortlessly deploy and
            engage with illustrative system contracts, simplifying the task of constructing and resolving
            issues within decentralized applications.
          </div>
        </div>

        {/* buttons */}
        <div className="flex flex-col gap-3">
          <div className="tracking-tight text-white/70">Here are the contracts exposed on this platform:</div>

          <div className="grid grid-rows-2 grid-cols-3 gap-x-6 gap-y-3">
            {NAV_SIDE_BAR_ITEMS.slice(1).map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className="tracking-tighter text-white/70 border border-white/30 text-center py-1 px-6 rounded-xl flex items-center justify-center hover:bg-black/30 transition duration-300"
              >
                {' '}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default OverviewSection;
