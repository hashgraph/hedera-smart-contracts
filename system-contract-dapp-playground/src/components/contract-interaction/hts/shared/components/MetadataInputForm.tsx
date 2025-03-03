// SPDX-License-Identifier: Apache-2.0

import { Tooltip } from '@chakra-ui/react';
import { SharedFormInputField, SharedRemoveFieldsButton } from './ParamInputForm';
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
        <Tooltip label={metadata.length > 0 && 'Add more metadata'} placement="top" fontWeight={'medium'}>
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
          <SharedFormInputField
            param={'metadata'}
            paramValue={meta.metaValue}
            fieldKeyToSet={meta.metaKey}
            handleInputOnChange={handleInputOnChange}
            paramKey={(htsTokenMintParamFields as any)['metadata'].paramKey}
            paramType={(htsTokenMintParamFields as any)['metadata'].inputType}
            paramSize={(htsTokenMintParamFields as any)['metadata'].inputSize}
            explanation={(htsTokenMintParamFields as any)['metadata'].explanation}
            paramClassName={(htsTokenMintParamFields as any)['metadata'].inputClassname}
            paramPlaceholder={(htsTokenMintParamFields as any)['metadata'].inputPlaceholder}
            paramFocusColor={(htsTokenMintParamFields as any)['metadata'].inputFocusBorderColor}
          />
          {/* delete key button */}
          <SharedRemoveFieldsButton fieldKey={meta.metaKey} handleModifyTokenAddresses={handleAddMetadata} />
        </div>
      ))}
    </div>
  );
};

export default MetadataInputForm;
