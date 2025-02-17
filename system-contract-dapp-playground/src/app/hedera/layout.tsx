// SPDX-License-Identifier: Apache-2.0

import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import NavSideBar from '@/components/sidebar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 px-6 overflow-x-hidden">
        {/* <NavSideBar /> */}
        <div>
          <NavSideBar />
        </div>
        {/* <Main children /> */}
        <div className="flex-1">{children}</div>

        {/* <RightSidebar /> */}
        <div>
          <div className="w-72" />
        </div>
      </div>

      <Footer />
    </main>
  );
}
