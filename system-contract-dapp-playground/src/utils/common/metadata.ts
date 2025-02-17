// SPDX-License-Identifier: Apache-2.0

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
