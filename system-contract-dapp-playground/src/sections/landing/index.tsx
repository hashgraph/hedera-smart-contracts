import { HmotionDiv, HmotionH1, HmotionP, HmotionSection } from '@/libs/framer-motion/motions';
import { VerticalCommonVariants } from '@/libs/framer-motion/variants';

const LandingPage = () => {
  const verticalVariant = VerticalCommonVariants(30, 0.5);
  return (
    <HmotionSection
      initial="hidden"
      whileInView="show"
      variants={verticalVariant}
      className="relative text-white 2xl:max-w-[100rem] 2xl:mx-auto h-full flex-1 w-full"
    >
      {/* Hero */}
      <HmotionDiv
        variants={verticalVariant}
        className="flex flex-col justify-center items-center mx-auto mt-20 md:mt-9 w-[90%] sm:w-[70%]"
      >
        {/* DAPP */}
        <HmotionDiv
          variants={verticalVariant}
          className="flex justify-center items-center text-transparent bg-clip-text bg-gradient-to-r from-hedera-green via-hedera-green to-hedera-green/50"
        >
          <div
            className="w-[60px] h-[38px] border-[9px] rounded-r-[50px] border-hedera-green mx-[6px]
                      sm:w-[80px] sm:h-[48px] sm:mx-2
                      md:w-[212px] md:h-[108px] md:border-[18px]"
          />
          <h1
            className="font-medium text-[44px] leading-[64.4px] uppercase
                      sm:text-[60px] sm:leading-[74.4px]
                      md:text-[100px] md:leading-[114.4px]
                      lg:text-[144px] lg:leading-[158.4px]"
          >
            App
          </h1>
        </HmotionDiv>

        {/* Playground */}
        <HmotionH1
          variants={verticalVariant}
          viewport={{ once: false, amount: 0.25 }}
          className="uppercase font-medium text-[39px] leading-[64.4px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50
                    sm:text-[60px] sm:tracking-wide
                    md:leading-[114.4px] sm:leading-[74.4px] md:text-[94px]
                    lg:text-[125px] lg:leading-[158.4px] lg:tracking-wider
                    xl:text-[144px] xl:leading-[158.4px] xl:tracking-wider"
        >
          Playground
        </HmotionH1>

        {/* Overview */}
        <HmotionP
          variants={verticalVariant}
          className="text-landing-text-hero font-normal text-center mt-6
                    sm:w-[38rem] sm:mt-3
                    md:w-[47rem] md:mt-6
                    lg:w-[57rem] lg:text-xl lg:mt-3"
        >
          <span className="text-hedera-green font-medium">Dapp playground</span> dolor sit amet,
          consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore{' '}
          <span className="text-hedera-green font-medium">Hedera network</span>. Urna id volutpat
          lacus laoreet non curabitur gravida. Nibh sit amet commodo nulla facilisi nullam vehicula
          ipsum. Sed enim ut sem viverra aliquet eget sit amet tellus eget magna{' '}
          <span className="text-hedera-green font-medium"> Swirlds Labs</span>.
        </HmotionP>
      </HmotionDiv>

      {/* Connect button */}
      <HmotionDiv
        variants={verticalVariant}
        className="bg-gradient-to-r from-hedera-gradient-1-blue to-hedera-gradient-1-purple text-2xl font-medium px-9 py-3 w-fit rounded-xl mx-auto cursor-pointer mt-12"
      >
        Connect Wallet
      </HmotionDiv>

      {/* signature */}
      <HmotionP
        variants={verticalVariant}
        className="absolute bottom-9 w-full text-center text-xl
                  sm:px-16 sm:text-2xl
                  md:w-fit md:px-24 
                  lg:text-3xl"
      >
        Accelerate the future on Hedera
      </HmotionP>
    </HmotionSection>
  );
};

export default LandingPage;
