// SPDX-License-Identifier: Apache-2.0

import {
  CryptoTransferParam,
  generateInitialCryptoTransferParamValues,
} from './helpers/generateInitialValues';
import { Dispatch, SetStateAction } from 'react';
import CryptoTransferInputFields from '../../../shared/components/CryptoTransferInputFields';

interface PageProps {
  handleModifyTransferRecords: any;
  handleCryptoTransferInputOnChange: any;
  cryptoTransferParamValues: CryptoTransferParam[];
  setCryptoTransferParamValues: Dispatch<SetStateAction<CryptoTransferParam[]>>;
}

const CryptoTransferForm = ({
  cryptoTransferParamValues,
  handleModifyTransferRecords,
  setCryptoTransferParamValues,
  handleCryptoTransferInputOnChange,
}: PageProps) => {
  return (
    <div>
      {/* title */}
      <div className="text-sm flex mb-3 items-center gap-3">
        <div className="w-full h-[1px] bg-hedera-green" />
        <div className="w-fit text-hedera-green">CRYPTO TRANSFER</div>
        <div className="w-full h-[1px] bg-hedera-green" />
      </div>

      {/* Add more crypto records */}
      <div className="flex flex-col gap-0 mb-6">
        <button
          onClick={() => {
            handleModifyTransferRecords(
              'CRYPTO',
              'ADD',
              setCryptoTransferParamValues,
              undefined,
              generateInitialCryptoTransferParamValues()
            );
          }}
          className="w-full rounded border border-white/30 text-center text-sm hover:border-hedera-purple hover:text-hedera-purple transition duration-300 hover:cursor-pointer "
        >
          Add more crypto transfer records
        </button>
      </div>

      {/* accountID && amount && isApproval */}
      <div className="flex flex-col gap-6 items-center w-full">
        {cryptoTransferParamValues.map((paramValue) => (
          <CryptoTransferInputFields
            key={paramValue.fieldKey}
            mode={'CRYPTO'}
            paramValue={paramValue}
            handleModifyRecords={() =>
              handleModifyTransferRecords(
                'CRYPTO',
                'REMOVE',
                setCryptoTransferParamValues,
                paramValue.fieldKey
              )
            }
            handleCryptoTransferInputOnChange={handleCryptoTransferInputOnChange}
            setCryptoTransferParamValues={setCryptoTransferParamValues}
          />
        ))}
      </div>
    </div>
  );
};

export default CryptoTransferForm;
