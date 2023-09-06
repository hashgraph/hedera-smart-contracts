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

import { Input, Tooltip } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { BsFillQuestionOctagonFill } from 'react-icons/bs';
import { HEDERA_BRANDING_COLORS } from '@/utils/common/constants';

interface PageProps {
  size: string;
  value: string;
  title: string;
  explanation: string;
  placeholder: string;
  titleBoxSize?: string; // must be in tailwindcss complete class name
  type: 'number' | 'text';
  setValue: Dispatch<SetStateAction<string>>;
}

const HederaCommonTextField = ({
  size,
  type,
  title,
  value,
  setValue,
  explanation,
  placeholder,
  titleBoxSize,
}: PageProps) => {
  return (
    <div className="flex gap-6">
      <div className={`flex items-center gap-1 ${titleBoxSize && titleBoxSize} justify-end`}>
        {/* title */}
        <p className="text-lg">{title}:</p>
        <Tooltip label={explanation} placement="top">
          <div className="cursor-pointer text-base">
            <BsFillQuestionOctagonFill />
          </div>
        </Tooltip>
      </div>

      {/* text field */}
      <Input
        value={value}
        type={type}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        placeholder={placeholder}
        size={size}
        variant="flushed"
        focusBorderColor={HEDERA_BRANDING_COLORS.purple}
        className="w-full"
      />
    </div>
  );
};

export default HederaCommonTextField;
