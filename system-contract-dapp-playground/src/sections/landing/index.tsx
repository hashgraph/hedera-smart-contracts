'use client';

import { motion } from 'framer-motion';
import { VerticalCommonVariants } from '@/libs/framer-motion/variants';
import {
  getEthereumObject,
  switchNetwork,
  requestAccount,
  isCorrectHederaNetwork,
  getWalletProvider,
} from '@/api/wallet';
import { useToast } from '@chakra-ui/react';
import { NoEthToast, CommonErrorToast } from '@/components/toast/CommonToast';
import { useEffect, useState } from 'react';

const LandingPage = () => {
  const toaster = useToast();
  const { walletProvider, err: walletProviderErr } = getWalletProvider();
  const [accounts, setAccounts] = useState<string[]>(['']);
  const verticalVariant = VerticalCommonVariants(30, 0.5);
  const [isDoneSwitchingNetwork, setIsDoneSwitchingNetwork] = useState(false);

  /** @dev handle connect wallet when a user click `connect wallet` button */
  const handleConnectWallet = async () => {
    // handle ethereum object or walletProvider being null by toasting it out on the client
    if (walletProviderErr === '!ETHEREUM' || !walletProvider) {
      NoEthToast({ toaster });
      return;
    }

    // detect if the current network is expected Hedera Networks
    if (!(await isCorrectHederaNetwork(walletProvider))) {
      // handle switching to the correct `Hedera testnet` network
      const networkSwitchErr = await switchNetwork(walletProvider);

      // handle error
      if (networkSwitchErr && networkSwitchErr.err) {
        let messageError = 'Unknown error appeared...';

        if (JSON.stringify(networkSwitchErr.err).indexOf('4001') !== -1) {
          messageError = 'You have rejected the request.';
        } else if (JSON.stringify(networkSwitchErr.err).indexOf('-32002') !== -1) {
          messageError = 'A network switch request already in progress.';
        }

        CommonErrorToast({
          toaster,
          title: 'Error switching network',
          description: messageError,
        });
        return;
      }
    }

    // turn the isDoneSwitchingNetwork to true if a network switch is done completely and successfully to Hedera Networks
    setIsDoneSwitchingNetwork(await isCorrectHederaNetwork(walletProvider));
  };

  // listen to isDoneSwitchingNetwork, make connect account request if true
  useEffect(() => {
    (async () => {
      if (isDoneSwitchingNetwork) {
        const { accounts, err: getAccountErr } = await requestAccount(walletProvider!);
        if (getAccountErr) {
          CommonErrorToast({
            toaster,
            title: 'Cannot connect account',
            description: getAccountErr.message,
            status: 'error',
          });
          setIsDoneSwitchingNetwork(false);
          return;
        }

        setAccounts(accounts as string[]);
      }
    })();
  }, [isDoneSwitchingNetwork]);

  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      variants={verticalVariant}
      className="relative text-white 2xl:max-w-[100rem] 2xl:mx-auto h-full flex-1 w-full"
    >
      {/* Hero */}
      <motion.div
        variants={verticalVariant}
        className="flex flex-col justify-center items-center mx-auto mt-20 md:mt-9 w-[90%] sm:w-[70%]"
      >
        {/* DAPP */}
        <motion.div
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
        </motion.div>

        {/* Playground */}
        <motion.h1
          variants={verticalVariant}
          viewport={{ once: false, amount: 0.25 }}
          className="uppercase font-medium text-[39px] leading-[64.4px] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50
                    sm:text-[60px] sm:tracking-wide
                    md:leading-[114.4px] sm:leading-[74.4px] md:text-[94px]
                    lg:text-[125px] lg:leading-[158.4px] lg:tracking-wider
                    xl:text-[144px] xl:leading-[158.4px] xl:tracking-wider"
        >
          Playground
        </motion.h1>

        {/* Overview */}
        <motion.p
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
        </motion.p>
      </motion.div>

      {/* Connect button */}
      <motion.div
        variants={verticalVariant}
        onClick={handleConnectWallet}
        className="bg-gradient-to-r from-hedera-gradient-1-blue to-hedera-gradient-1-purple text-2xl font-medium px-9 py-3 w-fit rounded-xl mx-auto cursor-pointer mt-12"
      >
        Connect Wallet
      </motion.div>

      {/* signature */}
      <motion.p
        variants={verticalVariant}
        className="absolute bottom-9 w-full text-center text-xl
                  sm:px-16 sm:text-2xl
                  md:w-fit md:px-24 
                  lg:text-3xl"
      >
        Accelerate the future on Hedera
      </motion.p>
    </motion.section>
  );
};

export default LandingPage;
