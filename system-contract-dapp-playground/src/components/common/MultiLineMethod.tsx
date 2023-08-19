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
import { Input, Tooltip } from '@chakra-ui/react';

interface PageProps {
  paramFields: {
    inputType: string;
    inputPlaceholder: string;
    inputSize: string;
    inputFocusBorderColor: string;
    inputClassname: string;
    paramKey: string;
  }[];
  methodName: string;
  params: any;
  setParams: any;
  explanation: string;
  widthSize?: string;
  isLoading?: boolean;
  handleExecute?: (method: any) => {};
}

const MultiLineMethod = ({
  paramFields,
  params,
  setParams,
  explanation,
  widthSize,
  isLoading,
  handleExecute,
  methodName,
}: PageProps) => {
  return (
    <div className={`flex flex-col ${widthSize && widthSize} gap-3`}>
      {/* inputs */}
      <div className="flex flex-col gap-3">
        {/* spender */}
        {paramFields.map((paramField) => {
          const handleInputOnChange = (e: any) => {
            setParams((prev: any) => ({ ...prev, [paramField.paramKey]: e.target.value }));
          };

          return (
            <Input
              key={paramField.paramKey}
              value={params[paramField.paramKey]}
              type={paramField.inputType}
              onChange={handleInputOnChange}
              placeholder={paramField.inputPlaceholder}
              size={paramField.inputSize}
              focusBorderColor={paramField.inputFocusBorderColor}
              className={paramField.inputClassname}
            />
          );
        })}
      </div>

      {/* execute button */}
      <Tooltip label={explanation} placement="top" fontWeight={'normal'}>
        {/* execute button */}
        <button
          onClick={handleExecute}
          disabled={isLoading}
          className={`border mt-3 py-2 rounded-xl transition duration-300 ${
            isLoading
              ? 'cursor-not-allowed border-white/30 text-white/30'
              : 'border-button-stroke-violet text-button-stroke-violet hover:bg-button-stroke-violet/60 hover:text-white'
          }`}
        >
          {isLoading ? (
            <div className="flex gap-1 justify-center">
              Executing...
              <Image
                src={'/brandings/hedera-logomark.svg'}
                alt={'hedera-logomark'}
                width={15}
                height={15}
                className="animate-bounce"
              />
            </div>
          ) : (
            <>{methodName}</>
          )}
        </button>
      </Tooltip>
    </div>
  );
};

export default MultiLineMethod;
