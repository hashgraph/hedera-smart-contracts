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
import { navVariants } from '@/libs/framer-motion/variants';

const Navbar = () => {
  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      whileInView="show"
      className="px-6 pt-6 sm:px-16 md:px-24 md:pt-9 flex justify-between items-center w-full z-50"
    >
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
    </motion.nav>
  );
};

export default Navbar;
