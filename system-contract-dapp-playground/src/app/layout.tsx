import '@/styles/globals.css';
import dappMetadata from '@/utils/metadata';

/** @notice Root Layout */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}

/** @notice export metadata for SEO */
export const metadata = dappMetadata;
