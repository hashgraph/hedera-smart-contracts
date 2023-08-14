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

import { Tooltip } from '@chakra-ui/react';
import { BsFillQuestionOctagonFill } from 'react-icons/bs';

interface PageProps {
  title: string;
  outputValue: string;
  titleBoxSize: string;
  explanation: string;
}

const OneLineMethod = ({ title, explanation, titleBoxSize, outputValue }: PageProps) => {
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
        className={`border border-button-stroke-violet text-button-stroke-violet mt-3 px-12 py-2 rounded-xl font-medium hover:bg-button-stroke-violet/60 hover:text-white transition duration-300`}
      >
        Execute
      </button>
    </div>
  );
};

export default OneLineMethod;
