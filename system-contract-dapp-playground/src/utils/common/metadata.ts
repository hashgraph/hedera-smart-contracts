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

import { Metadata } from 'next';

const DAPP_NAME = 'Hedera System Contract Dapp';
const TITLE = 'System Contract Dapp Playground | Hedera';
const DESCRIPTION = "Explore Hedera's system smart contract through an intutive and exciting Dapp Playground";
const OFFICIAL_REPO_URL =
  'https://github.com/hashgraph/hedera-smart-contracts/system-contract-dapp-playground';

const dappMetadata: Metadata = {
  // ######## DAPP ########
  applicationName: DAPP_NAME,
  keywords: [
    'Hedera System Contract Dapp',
    'Hashgraph System Contract Dapp',
    'Hedera',
    'Hashgraph',
    'Swirlds Labs',
    'Dapp Playground',
    'Hedera System Smart Contracts',
  ],
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: '/hederafavicon.ico',
    shortcut: '/hederafavicon.ico',
  },
  metadataBase: new URL(OFFICIAL_REPO_URL),
  alternates: {
    canonical: '/',
  },

  // ######## OG ########
  openGraph: {
    siteName: DAPP_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_US',
    type: 'website',
    url: '/',
  },

  // ######## Twitter ########
  twitter: {
    card: 'summary_large_image',
    site: OFFICIAL_REPO_URL,
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default dappMetadata;
