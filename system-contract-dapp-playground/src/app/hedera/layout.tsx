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
