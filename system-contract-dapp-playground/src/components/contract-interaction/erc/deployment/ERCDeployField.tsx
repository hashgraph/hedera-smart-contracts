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
