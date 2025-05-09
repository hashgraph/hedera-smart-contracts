// SPDX-License-Identifier: Apache-2.0

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BsGithub } from 'react-icons/bs';
import { Tooltip } from '@chakra-ui/react';
import { IoOpenOutline } from 'react-icons/io5';
import ContractInteraction from '@/components/contract-interaction';
import { HEDERA_OFFICIAL_HIPS_URL, HEDERA_SMART_CONTRACTS_ASSETS } from '@/utils/common/constants';

const HTS206Section = () => {
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
          HTS System Contract Wrapper
          <div className="flex">
            (
            <Link
              href={`${HEDERA_OFFICIAL_HIPS_URL}/hip/hip-206`}
              target="_blank"
              className="hover:underline flex gap-/1 items-center"
            >
              <p>HIP-206</p>
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
          <p className="tracking-tight text-white/70">
            The integration of Hedera Token Service (HTS) with the Hedera Smart Contract Service (HSCS),
            allowing contracts to transfer, mint, burn, associate, and dissociate tokens programmatically.
          </p>
        </div>
      </div>

      {/* break line */}
      <hr className="border-t border-white/40" />

      {/* Smart contracts */}
      <div className="flex flex-col gap-6">
        {/* title & abstract*/}
        <div>
          {/* title */}
          <h3 className="text-[1.65rem] font-medium">Example Smart Contracts</h3>

          {/* abstract */}
          <p className="tracking-tight text-white/70">
            These example smart contracts demonstrate how the HTS system contract is employed to carry out
            their functions effectively. They serve as clear examples of how the HTS system contract can be
            put to practical use.
          </p>
        </div>

        {/* Contracts */}
        <ol className="px-6 flex flex-col gap-9">
          {HEDERA_SMART_CONTRACTS_ASSETS.HTS_PRECOMPILED.map((contract, index) => (
            <li key={contract.name} className="flex flex-col gap-3 w-full">
              {/* title */}
              <div className="flex gap-1 items-center text-[20px]">
                {/* title */}
                <p>
                  {index + 1}. {contract.title}
                </p>

                {/* Github icon */}
                <Tooltip label="Visit source code on Github." placement={'top'}>
                  <Link href={contract.githubUrl} target="_blank" className="text-2xl">
                    <BsGithub />
                  </Link>
                </Tooltip>
              </div>

              {/* contract interaction component */}
              <ContractInteraction contract={contract} />
            </li>
          ))}
        </ol>
      </div>
    </motion.section>
  );
};

export default HTS206Section;
