import '@/styles/globals.css';

/** @notice Root Layout */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
