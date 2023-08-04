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

import { motion } from 'framer-motion';
import { VerticalCommonVariants } from '@/libs/framer-motion/variants';

const LandingPage = () => {
  const verticalVariant = VerticalCommonVariants(30, 0.5);
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      variants={verticalVariant}
      className="relative text-white 2xl:max-w-[100rem] 2xl:mx-auto h-full flex-1 w-full"
    >
      {/* Hero */}
      <motion.div
        variants={verticalVariant}
        className="flex flex-col justify-center items-center mx-auto mt-20 md:mt-9 w-[90%] sm:w-[70%]"
      >
        {/* DAPP */}
        <motion.div
          variants={verticalVariant}
          className="flex justify-center items-center text-transparent bg-clip-text bg-gradient-to-r from-hedera-green via-hedera-green to-hedera-green/50"
        >
          <div
            className="w-[60px] h-[38px] border-[9px] rounded-r-[50px] border-hedera-green mx-[6px]
                      sm:w-[80px] sm:h-[48px] sm:mx-2
                      md:w-[212px] md:h-[108px] md:border-[18px]"
          />
          <h1
            className="font-medium text-[44px] leading-[64.4px] uppercase
                      sm:text-[60px] sm:leading-[74.4px]
                      md:text-[100px] md:leading-[114.4px]
                      lg:text-[144px] lg:leading-[158.4px]"
          >
            App
          </h1>
        </motion.div>

        {/* Playground */}
        <motion.h1
          variants={verticalVariant}
          viewport={{ once: false, amount: 0.25 }}
          className="uppercase font-medium text-[39px] leading-[64.4px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50
                    sm:text-[60px] sm:tracking-wide
                    md:leading-[114.4px] sm:leading-[74.4px] md:text-[94px]
                    lg:text-[125px] lg:leading-[158.4px] lg:tracking-wider
                    xl:text-[144px] xl:leading-[158.4px] xl:tracking-wider"
        >
          Playground
        </motion.h1>

        {/* Overview */}
        <motion.p
          variants={verticalVariant}
          className="text-landing-text-hero font-normal text-center mt-6
                    sm:w-[38rem] sm:mt-3
                    md:w-[47rem] md:mt-6
                    lg:w-[57rem] lg:text-xl lg:mt-3"
        >
          <span className="text-hedera-green font-medium">DApp Playground</span>, a user-friendly
          interface designed to showcase the power of system contracts on the{' '}
          <span className="text-hedera-green font-medium">Hedera network</span>. Effortlessly deploy
          and interact with example contracts, streamline dApp development, and integrate with
          familiar web3 wallets. Revolutionize the dApp landscape today by harnessing the power of{' '}
          <span className="text-hedera-green font-medium">Hedera</span>!
        </motion.p>
      </motion.div>

      {/* Connect button */}
      <motion.div
        variants={verticalVariant}
        className="bg-gradient-to-r from-hedera-gradient-1-blue to-hedera-gradient-1-purple text-2xl font-medium px-9 py-3 w-fit rounded-xl mx-auto cursor-pointer mt-12"
      >
        Connect Wallet
      </motion.div>

      {/* signature */}
      <motion.p
        variants={verticalVariant}
        className="absolute bottom-9 w-full text-center text-xl
                  sm:px-16 sm:text-2xl
                  md:w-fit md:px-24 
                  lg:text-3xl"
      >
        Accelerate the future on Hedera
      </motion.p>
    </motion.div>
  );
};

export default LandingPage;
