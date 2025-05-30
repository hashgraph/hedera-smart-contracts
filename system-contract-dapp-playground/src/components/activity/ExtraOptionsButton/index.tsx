// SPDX-License-Identifier: Apache-2.0

import { CSVLink } from 'react-csv';
import { FiMoreVertical } from 'react-icons/fi';
import { Dispatch, SetStateAction } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@chakra-ui/react';
import { ITransactionResult } from '@/types/contract-interactions/shared';

interface PageProps {
  onOpen: any;
  CSVData: any;
  CSVHeaders: any;
  selectedTransactionList: ITransactionResult[];
  setIsRemoveModalOpen: Dispatch<SetStateAction<boolean>>;
}

const ExtraOptionsButton = ({
  onOpen,
  CSVData,
  CSVHeaders,
  setIsRemoveModalOpen,
  selectedTransactionList,
}: PageProps) => {
  return (
    <div>
      <Popover placement="right">
        <PopoverTrigger>
          <button
            disabled={selectedTransactionList.length === 0}
            className={`border border-white/30 text-sm p-2 rounded-lg flex items-center justify-center ${
              selectedTransactionList.length > 0
                ? `cursor-pointer hover:bg-button-stroke-violet transition duration-300`
                : `cursor-not-allowed text-gray-500`
            }`}
          >
            <FiMoreVertical />
          </button>
        </PopoverTrigger>
        <PopoverContent className="bg-button w-fit py-3 border-white/30">
          <div className="flex flex-col gap-3">
            {/* Export button */}
            <CSVLink
              data={CSVData}
              headers={CSVHeaders}
              filename={'hedera-system-contract-dapp-transactions.csv'}
              target="_blank"
              className={`text-sm pl-3 py-2 pr-6 text-left cursor-pointer hover:bg-neutral-700/50 transition duration-300 w-full`}
            >
              Export selected records
            </CSVLink>

            {/* remove button */}
            <button
              onClick={() => {
                onOpen();
                setIsRemoveModalOpen(true);
              }}
              className={`text-sm pl-3 py-2 pr-6 text-left cursor-pointer hover:bg-neutral-700/50 transition duration-300 w-full`}
            >
              Remove selected records
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ExtraOptionsButton;
