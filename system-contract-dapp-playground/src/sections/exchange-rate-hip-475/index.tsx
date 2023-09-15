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
import { BsGithub } from 'react-icons/bs';
import { Tooltip } from '@chakra-ui/react';
import { IoOpenOutline } from 'react-icons/io5';
import ContractInteraction from '@/components/contract-interaction';
import { HEDERA_OFFICIAL_HIPS_URL, HEDERA_SMART_CONTRACTS_ASSETS } from '@/utils/common/constants';

const HIP475Section = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{
        delay: 0.3,
        duration: 0.6,
      }}
      viewport={{ once: true }}
      className="text-white w-full flex pt-7 pb-12 pl-7 flex-col gap-9 min-w-[50rem]"
    >
      {/* top part */}
      <div className="flex flex-col gap-6">
        {/* TITLE */}
        <h1 className="text-[1.88rem] font-medium leading-10 flex gap-1 whitespace-nowrap">
          Exchange Rate System Contract Wrapper
          <div className="flex">
            (
            <Link
              href={`${HEDERA_OFFICIAL_HIPS_URL}/hip/hip-475`}
              target="_blank"
              className="hover:underline flex gap-1 items-center"
            >
              <p>HIP-475</p>
              <div className="text-2xl">
                <IoOpenOutline />
              </div>
            </Link>
            )
          </div>
        </h1>

        {/* content */}
        <div>
          {/* Overview */}
          <div className="text-[1.65rem] font-medium">Overview</div>

          {/* content */}
          <div className="tracking-tight text-white/70">
            A system contract to convert between tinybars and tinycents at the network&apos;s active exchange
            rate in system file <span className="bg-hedera-purple/30 tracking-wide">0.0.112</span>; that is,
            at the exchange rate the network is using to calculate fees. The network calculates fees as
            follows: Starting with the USD resource prices in system file{' '}
            <span className="bg-hedera-purple/30 tracking-wide">0.0.111</span>, it multiplies each resource
            price by the amount of that resource used; then sums all these usage prices to get a total USD
            value; and finally converts from USD to tinybars via the active exchange rate.
          </div>
        </div>
      </div>

      {/* Contract */}
      <div className="flex flex-col">
        <div className="flex flex-col gap-6 w-full">
          {/* title */}
          <div className="flex gap-1 items-center text-[20px]">
            {/* title */}
            <p>{HEDERA_SMART_CONTRACTS_ASSETS.EXCHANGE_RATE.title}</p>

            {/* Github icon */}
            <Tooltip label="Visit source code on Github." placement={'top'}>
              <Link
                href={HEDERA_SMART_CONTRACTS_ASSETS.EXCHANGE_RATE.githubUrl}
                target="_blank"
                className="text-2xl"
              >
                <BsGithub />
              </Link>
            </Tooltip>
          </div>

          {/* contract interaction component */}
          <ContractInteraction contract={HEDERA_SMART_CONTRACTS_ASSETS.EXCHANGE_RATE} />
        </div>
      </div>
    </motion.section>
  );
};

export default HIP475Section;
