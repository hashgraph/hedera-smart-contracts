// SPDX-License-Identifier: Apache-2.0

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BsGithub } from 'react-icons/bs';
import { Tooltip } from '@chakra-ui/react';
import { IoOpenOutline } from 'react-icons/io5';
import ContractInteraction from '@/components/contract-interaction';
import { HEDERA_SMART_CONTRACTS_ASSETS } from '@/utils/common/constants';

const ERC20Section = () => {
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
          Fungible Token
          <div className="flex">
            (
            <Link
              href={`https://eips.ethereum.org/EIPS/eip-20`}
              target="_blank"
              className="hover:underline flex gap-1 items-center"
            >
              <p>ERC-20</p>
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
            This standard provides basic functionality to transfer tokens, as well as allow tokens to be
            approved so they can be spent by another on-chain third party.
          </div>
        </div>
      </div>

      {/* Contract */}
      <div className="flex flex-col">
        <div className="flex flex-col gap-6 w-full">
          {/* title */}
          <div className="flex gap-1 items-center text-[20px]">
            {/* title */}
            <p>{HEDERA_SMART_CONTRACTS_ASSETS.ERC_20.title}</p>

            {/* Github icon */}
            <Tooltip label="Visit source code on Github." placement={'top'}>
              <Link
                href={HEDERA_SMART_CONTRACTS_ASSETS.ERC_20.githubUrl}
                target="_blank"
                className="text-2xl"
              >
                <BsGithub />
              </Link>
            </Tooltip>
          </div>

          {/* contract interaction component */}
          <ContractInteraction contract={HEDERA_SMART_CONTRACTS_ASSETS.ERC_20} />
        </div>
      </div>
    </motion.section>
  );
};

export default ERC20Section;
