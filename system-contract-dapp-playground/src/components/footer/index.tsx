// SPDX-License-Identifier: Apache-2.0

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { HEDERA_SOCIAL_MEDIA } from '@/utils/common/constants';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{
        delay: 0.3,
        duration: 0.3,
      }}
      viewport={{ once: true }}
      className="text-white px-6 w-full z-40 flex flex-col items-center"
    >
      <hr className="w-[99vw] border-t border-white/40" />
      <div
        className="w-full flex flex-col gap-6 py-3
                  md:flex-row md:justify-between md:items-center md:py-6 md:pb-3"
      >
        {/* Logo & copyright*/}
        <div className="flex flex-col gap-1 justify-center items-center md:items-start">
          {/* logo */}
          <Link href={'/'} className="flex gap-2 items-center justify-center">
            {/* logo icon */}
            <Image
              src={'/brandings/hedera-logomark.svg'}
              alt={'hedera-logomark'}
              width={30}
              height={30}
              className="z-50"
            />

            {/* logo text */}
            <p className="text-white">Hedera</p>
          </Link>

          {/* copyright */}
          <p className="font-light text-sm">
            &copy; 2018 - {new Date().getFullYear()} Hedera Hashgraph, LLC.
          </p>
        </div>

        {/* social media */}
        <div className="flex items-center justify-center gap-4 md:justify-start lg:gap-6">
          {HEDERA_SOCIAL_MEDIA.map((media) => {
            return (
              <Link key={media.name} href={media.link} target="_blank">
                <Image src={`/assets/socials/${media.name}.svg`} alt={media.name} width={24} height={24} />
              </Link>
            );
          })}
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
