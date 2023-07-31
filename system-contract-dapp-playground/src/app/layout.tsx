import '@/styles/globals.css';
import StyreneAWebFont from '@/fonts';
import dappMetadata from '@/utils/metadata';

/** @notice Root Layout */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${StyreneAWebFont.className}`}>
      <body>{children}</body>
    </html>
  );
}

/** @notice export metadata for SEO */
export const metadata = dappMetadata;
