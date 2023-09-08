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
