// SPDX-License-Identifier: Apache-2.0

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
