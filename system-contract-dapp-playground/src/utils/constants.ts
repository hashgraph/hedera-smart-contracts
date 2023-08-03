export const HEDERA_SOCIAL_MEDIA = [
  {
    name: 'discord',
    link: 'https://discord.com/invite/hedera',
  },
  {
    name: 'facebook',
    link: 'https://www.facebook.com/hashgraph',
  },
  {
    name: 'linkedin',
    link: 'https://www.linkedin.com/company/hashgraph/',
  },
  {
    name: 'reddit',
    link: 'https://www.reddit.com/r/Hedera/',
  },
  {
    name: 'telegram',
    link: 'https://t.me/hederahashgraph',
  },
  {
    name: 'twitter',
    link: 'https://twitter.com/hedera',
  },
  {
    name: 'youtube',
    link: 'https://www.youtube.com/hederahashgraph',
  },
];

/**
 * @notice information about Hedera Networks
 */
export const HEDERA_NETWORKS = {
  mainnet: {
    chainId: '295',
    chainIdHex: '0x127',
    chainName: 'Hedera Mainnet',
    rpcUrls: 'https://mainnet.hashio.io/api',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'https://hashscan.io/mainnet/dashboard',
  },
  testnet: {
    chainId: '296',
    chainIdHex: '0x128',
    chainName: 'Hedera Testnet',
    rpcUrls: 'https://testnet.hashio.io/api',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'https://hashscan.io/testnet/dashboard',
  },
  previewnet: {
    chainId: '297',
    chainIdHex: '0x129',
    chainName: 'Hedera Previewnet',
    rpcUrls: 'https://previewnet.hashio.io/api',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'https://hashscan.io/previewnet/dashboard',
  },
  localnet: {
    chainId: '298',
    chainIdHex: '0x12a',
    chainName: 'Hedera Localnet',
    rpcUrls: 'http://localhost:7546',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'http://localhost:8080',
  },
};
