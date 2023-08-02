'use client';

import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';

/** @notice learn more about ChakraUI installization with next@13 at https://chakra-ui.com/getting-started/nextjs-guide#app-directory-setup */
const ChakraUIProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <CacheProvider>
      <ChakraProvider>{children}</ChakraProvider>
    </CacheProvider>
  );
};

export default ChakraUIProviders;
