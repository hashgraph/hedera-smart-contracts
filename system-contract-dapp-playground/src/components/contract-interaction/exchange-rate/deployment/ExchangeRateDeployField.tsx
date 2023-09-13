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
import HederaCommonTextField from '../../../common/HederaCommonTextField';

interface PageProps {
  isDeploying: boolean;
  setDeployedParams: Dispatch<any>;
  setDidDeployStart: Dispatch<SetStateAction<boolean>>;
}

const ExchangeRateDeployField = ({
  isDeploying,
  setDidDeployStart,
  setDeployedParams,
}: PageProps) => {
  const toaster = useToast();
  const [value, setValue] = useState('');

  const handleDeploy = async () => {
    // stop user when the param is empty
    if (value === '') {
      CommonErrorToast({
        toaster,
        title: 'Cannot deploy contract',
        description: 'Toll fee cannot be empty',
      });
      return;
    }

    // update global deployedParam
    setDeployedParams([value]);

    // trigger deploySmartContract API
    setDidDeployStart(true);
  };

  return (
    <div className="flex gap-6 items-center">
      <HederaCommonTextField
        size="md"
        title="Toll"
        value={value}
        type="number"
        setValue={setValue}
        placeholder="e.g. 100"
        explanation="The USD in cents that must be sent as msg.value"
      />

      {/* deploy button */}
      <button
        onClick={handleDeploy}
        disabled={isDeploying}
        className={`border border-hedera-green text-hedera-green px-6 py-2 rounded-xl font-medium hover:bg-hedera-green/50 hover:text-white transition duration-300 ${
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

export default ExchangeRateDeployField;
