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

import { useState } from 'react';
import { Tooltip } from '@chakra-ui/react';
import { AiOutlineMinus } from 'react-icons/ai';
import { ERC20MockMethod } from '../../utils/methodInterfaces';
import HederaCommonTextField from '@/components/common/HederaCommonTextField';

interface PageProps {
  baseContract: ERC20MockMethod;
}

const BalanceOf = ({ baseContract }: PageProps) => {
  const [value, setValue] = useState('');
  const [balances, setBalances] = useState([
    {
      address: '0x7A575266b2020e262E9b1ad4EBA3014D63630095',
      amount: '120',
    },
    {
      address: '0xcc07a8243578590d55c5708d7fb453245350cc2a',
      amount: '369',
    },
  ]);

  /** @dev handle executing balance of */
  const handleExecuteBalanceOf = () => {
    setBalances([...balances, { address: value, amount: '39' }]);
    setValue('');
  };

  /** @dev handle remove record */
  const handleRemoveRecord = (addr: string) => {
    setBalances((prev) => prev.filter((record) => record.address !== addr));
  };

  return (
    <div className=" flex flex-col items-start gap-12">
      {/* wrapper */}
      <div className="flex gap-12 items-center w-[580px]">
        {/* method */}
        <HederaCommonTextField
          size={'md'}
          value={value}
          title={'Balance of'}
          explanation={'Returns the amount of tokens owned by account.'}
          placeholder={'Account address...'}
          type={'text'}
          setValue={setValue}
        />

        {/* execute button */}
        <button
          onClick={handleExecuteBalanceOf}
          className={`border border-button-stroke-violet text-button-stroke-violet mt-3 px-12 py-2 rounded-xl font-medium hover:bg-button-stroke-violet/60 hover:text-white transition duration-300`}
        >
          Execute
        </button>
      </div>

      <div className="flex flex-col gap-6 text-base">
        {/* display balances */}
        {balances.length > 0 &&
          balances.map((balance) => (
            <div key={balance.address} className="flex gap-6 items-center">
              <div className="flex justify-between w-[580px]">
                {/* Address */}
                <p className="text-white/80">{balance.address}</p>

                {/* amount */}
                <p className="font-medium">{balance.amount}</p>
              </div>
              {/* delete button */}
              <Tooltip label="delete this record" placement="top">
                <button
                  onClick={() => {
                    handleRemoveRecord(balance.address);
                  }}
                  className="border border-white/30 px-1 py-1 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-400 transition duration-300"
                >
                  <AiOutlineMinus />
                </button>
              </Tooltip>
            </div>
          ))}
      </div>
    </div>
  );
};

export default BalanceOf;
