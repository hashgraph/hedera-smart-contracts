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

import { AiOutlineMinus } from 'react-icons/ai';
import { Tooltip, Input } from '@chakra-ui/react';
import { htsTokenMintParamFields } from '@/utils/contract-interactions/HTS/token-create-custom/constant';

interface PageProps {
  handleInputOnChange: any;
  handleAddMetadata: any;
  metadata: {
    metaKey: string;
    metaValue: string;
  }[];
}

const MetadataInputForm = ({ metadata, handleInputOnChange, handleAddMetadata }: PageProps) => {
  return (
    <div className="flex flex-col gap-6">
      {/* Add metadata */}
      <div className="flex flex-col gap-0">
        <Tooltip
          label={metadata.length > 0 && 'Add more metadata'}
          placement="top"
          fontWeight={'medium'}
        >
          <button
            onClick={() => handleAddMetadata('ADD')}
            className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
          >
            {metadata.length === 0 ? `Add metadata` : '+'}
          </button>
        </Tooltip>
      </div>

      {/* metadata fields */}
      {metadata.map((meta) => (
        <div key={meta.metaKey} className="flex gap-3 items-center">
          <Tooltip
            label={(htsTokenMintParamFields as any)['metadata'].explanation}
            placement="top"
            fontWeight={'medium'}
          >
            <Input
              value={meta.metaValue}
              type={(htsTokenMintParamFields as any)['metadata'].inputType}
              onChange={(e) => handleInputOnChange(e, 'metadata', meta.metaKey)}
              placeholder={(htsTokenMintParamFields as any)['metadata'].inputPlaceholder}
              size={(htsTokenMintParamFields as any)['metadata'].inputSize}
              focusBorderColor={(htsTokenMintParamFields as any)['metadata'].inputFocusBorderColor}
              className={(htsTokenMintParamFields as any)['metadata'].inputClassname}
            />
          </Tooltip>
          {/* delete key button */}
          <Tooltip label="delete this record" placement="top">
            <button
              onClick={() => handleAddMetadata('REMOVE', meta.metaKey)}
              className={`border h-fit border-white/30 text-base px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300`}
            >
              <AiOutlineMinus />
            </button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
};

export default MetadataInputForm;
