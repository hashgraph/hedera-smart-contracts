// SPDX-License-Identifier: Apache-2.0

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { NAV_SIDE_BAR_ITEMS } from '@/utils/common/constants';

const NavSideBar = () => {
  const pathname = usePathname();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{
        delay: 0.3,
        duration: 0.3,
      }}
      viewport={{ once: true }}
      className="w-72 h-full border-r border-white/30 text-white flex flex-col gap-3 pt-7 text-lg font-light tracking-tight leading-6 pr-2"
    >
      {NAV_SIDE_BAR_ITEMS.map((item) => (
        <Link
          key={item.name}
          href={item.path}
          className={`${
            pathname.includes(item.path) && `bg-black/30 font-normal text-hedera-purple`
          } py-3 px-3 rounded-lg hover:bg-black/30 transition duration-300`}
        >
          {item.name}
        </Link>
      ))}
    </motion.div>
  );
};

export default NavSideBar;
