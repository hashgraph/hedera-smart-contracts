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

import localFont from 'next/font/local';

/** @notice learn more about localFont at https://nextjs.org/docs/app/building-your-application/optimizing/fonts#local-fonts */
const StyreneAWebFont = localFont({
  src: [
    {
      path: './styreneA-webfont/StyreneA-Black-Web.woff2',
      weight: '900',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BlackItalic-Web.woff2',
      weight: '900',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Bold-Web.woff2',
      weight: '800',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BoldItalic-Web.woff2',
      weight: '800',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Bold-Web.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BoldItalic-Web.woff2',
      weight: '700',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Bold-Web.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-BoldItalic-Web.woff2',
      weight: '600',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Medium-Web.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-MediumItalic-Web.woff2',
      weight: '500',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Regular-Web.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-RegularItalic-Web.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Light-Web.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-LightItalic-Web.woff2',
      weight: '300',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Light-Web.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-LightItalic-Web.woff2',
      weight: '200',
      style: 'italic',
    },
    {
      path: './styreneA-webfont/StyreneA-Thin-Web.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: './styreneA-webfont/StyreneA-ThinItalic-Web.woff2',
      weight: '100',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-styrene',
});

export default StyreneAWebFont;
