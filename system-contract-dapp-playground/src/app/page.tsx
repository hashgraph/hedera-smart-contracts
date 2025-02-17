// SPDX-License-Identifier: Apache-2.0
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import LandingPage from '@/sections/landing';

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <Navbar />
      <LandingPage />;
      <Footer />
    </main>
  );
}
