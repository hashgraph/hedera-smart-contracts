// SPDX-License-Identifier: Apache-2.0

import '@/styles/globals.css';
import StyreneAWebFont from '@/fonts';
import dappMetadata from '@/utils/common/metadata';
import ChakraUIProviders from '@/libs/chakra/provider';
import BgGradient from '@/components/background-gradients';

/** @notice Root Layout */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${StyreneAWebFont.variable}`}>
      <body className="bg-primary font-styrene">
        <ChakraUIProviders>
          <div className="relative 2xl:max-w-[100rem] 2xl:mx-auto">
            {children}
            <BgGradient />
          </div>
        </ChakraUIProviders>
      </body>
    </html>
  );
}

/** @notice export metadata for SEO */
export const metadata = dappMetadata;
