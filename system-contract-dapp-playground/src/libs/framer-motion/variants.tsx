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

import { Variants } from 'framer-motion';

export const navVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 140,
    },
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      delay: 0.6,
    },
  },
};

export const VerticalCommonVariants = (
  initY: number,
  initDuration?: number,
  initStaggerChildren?: number
): Variants => {
  return {
    hidden: {
      opacity: 0,
      y: initY,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 140,
      },
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: initDuration ? initDuration : 0.3,
        staggerChildren: initStaggerChildren ? initStaggerChildren : 0.13,
        type: 'spring',
        stiffness: 80,
      },
    },
  };
};
