// SPDX-License-Identifier: Apache-2.0

import Image from 'next/image';
import { useToast } from '@chakra-ui/react';
import { Dispatch, SetStateAction, useState } from 'react';
import { CommonErrorToast } from '../../../toast/CommonToast';
import HederaCommonTextField from '../../../common/components/HederaCommonTextField';

interface PageProps {
  isDeploying: boolean;
  setDeployedParams: Dispatch<any>;
  setDidDeployStart: Dispatch<SetStateAction<boolean>>;
}

const ERC20DeployField = ({ isDeploying, setDidDeployStart, setDeployedParams }: PageProps) => {
  const toaster = useToast();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');

  const handleDeploy = async () => {
    // stop user when the params are empty
    let description = null;
    if (name === '' && symbol === '') {
      description = `Param fields cannot be empty`;
    } else if (name === '') {
      description = `Name field cannot be empty`;
    } else if (symbol === '') {
      description = `Symbol field cannot be empty`;
    }
    if (description) {
      CommonErrorToast({
        toaster,
        title: 'Cannot deploy contract',
        description,
      });
      return;
    }

    // update global deployedParam
    setDeployedParams([name, symbol]);

    // trigger deploySmartContract API
    setDidDeployStart(true);
  };

  return (
    <div className="flex flex-col gap-3 items-center justify-center">
      <HederaCommonTextField
        size="md"
        type="text"
        title="Name"
        value={name}
        setValue={setName}
        titleBoxSize="w-[200px]"
        placeholder="e.g. Hedera"
        explanation="The name of the token"
      />
      <HederaCommonTextField
        size="md"
        type="text"
        title="Symbol"
        value={symbol}
        setValue={setSymbol}
        titleBoxSize="w-[200px]"
        placeholder="e.g. HBAR"
        explanation="The symbol of the token"
      />

      {/* deploy button */}
      <button
        onClick={handleDeploy}
        disabled={isDeploying}
        className={`border border-hedera-green text-hedera-green mt-3 px-24 py-2 rounded-xl font-medium hover:bg-hedera-green/50 hover:text-white transition duration-300 ${
          isDeploying && `cursor-not-allowed`
        }`}
      >
        {isDeploying ? (
          <div className="flex gap-3">
            Deploying...
            <Image
              src={'/brandings/hedera-logomark.svg'}
              alt={'hedera-logomark'}
              width={15}
              height={15}
              className="animate-bounce"
            />
          </div>
        ) : (
          'Deploy'
        )}
      </button>
    </div>
  );
};

export default ERC20DeployField;
