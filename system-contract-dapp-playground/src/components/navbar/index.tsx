import Link from 'next/link';
import Image from 'next/image';
import { navVariants } from '@/libs/framer-motion/variants';
import { HmotionNav } from '@/libs/framer-motion/motions';

const Navbar = () => {
  return (
    <HmotionNav
      variants={navVariants}
      initial="hidden"
      whileInView="show"
      className="px-6 pt-6 sm:px-16 md:px-24 md:pt-9 flex justify-between items-center w-full z-50"
    >
      <Link href={'/'}>
        {/* Logo */}
        <Image
          src={'/brandings/hedera-logomark.svg'}
          alt={'hedera-logomark'}
          width={50}
          height={50}
          className="z-50"
        />
      </Link>

      {/* Text logo */}
      <p className="text-white text-[2rem]">Hedera</p>
    </HmotionNav>
  );
};

export default Navbar;
