// SPDX-License-Identifier: Apache-2.0

import { Tooltip } from '@chakra-ui/react';
import Image from 'next/image';
import { BsFillQuestionOctagonFill } from 'react-icons/bs';

interface PageProps {
  title: string;
  outputValue: string;
  titleBoxSize: string;
  explanation: string;
  isLoading?: boolean;
  handleExecute?: (method: any) => {};
}

const OneLineMethod = ({
  title,
  explanation,
  titleBoxSize,
  outputValue,
  handleExecute,
  isLoading,
}: PageProps) => {
  return (
    <div className="flex items-center gap-12 px-6">
      {/* title & question mark */}
      <div className={`flex items-center gap-1 ${titleBoxSize && titleBoxSize} justify-end`}>
        {/* title */}
        <p className="text-lg">{title}:</p>
        <Tooltip label={explanation} placement="top">
          <div className="cursor-pointer text-base">
            <BsFillQuestionOctagonFill />
          </div>
        </Tooltip>
      </div>

      {/* output placeholder */}
      <p
        className={`border-b min-w-[200px] min-h-[30px] text-center whitespace-nowrap overflow-hidden overflow-ellipsis text-base ${
          outputValue !== '' ? `border-button-stroke-violet` : `border-white`
        }`}
      >
        {outputValue}
      </p>

      {/* execute button */}
      <button
        onClick={handleExecute}
        disabled={isLoading || outputValue !== ''}
        className={`border mt-3 w-48 py-2 rounded-xl transition duration-300 ${
          isLoading || outputValue !== ''
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
          <>{outputValue !== '' ? `Executed` : `Execute`}</>
        )}
      </button>
    </div>
  );
};

export default OneLineMethod;
