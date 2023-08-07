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
import { usePathname } from 'next/navigation';
import { LEFT_SIDE_BAR_ITEMS } from '@/utils/constants';

const LeftSideBar = () => {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full border-r border-white/30 text-white flex flex-col gap-3 pt-7 text-lg font-light tracking-tight leading-6 pr-2">
      {LEFT_SIDE_BAR_ITEMS.map((item) => (
        <Link
          key={item.name}
          href={item.path}
          className={`${
            pathname.includes(item.path) && `bg-black/30 font-normal text-hedera-purple`
          } py-3 px-3 rounded-lg hover:bg-black/30`}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
};

export default LeftSideBar;
