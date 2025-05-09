// SPDX-License-Identifier: Apache-2.0

import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { Dispatch, ReactNode, SetStateAction, useRef } from 'react';

interface PageProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  alertTitle: string;
  alertMsg: ReactNode;
  confirmBtnTitle: string;
  confirmCallBack: any;
  cancelBtn?: boolean;
}

const HederaAlertDialog = ({
  isOpen,
  setIsOpen,
  alertTitle,
  alertMsg,
  confirmBtnTitle,
  confirmCallBack,
  cancelBtn,
}: PageProps) => {
  const cancelRef = useRef<any>();
  const onClose = () => setIsOpen(false);

  return (
    <>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
        <AlertDialogOverlay className="flex justify-center items-center">
          <div className="bg-secondary text-white w-[550px] /h-[300px] rounded-2xl shadow-2xl flex flex-col items-center">
            <AlertDialogHeader className=" font-medium text-2xl">{alertTitle}</AlertDialogHeader>
            <hr className="border-white/30 w-full" />

            <div className="flex flex-col items-center gap-3 pt-6">
              <AlertDialogBody className="text-lg">{alertMsg}</AlertDialogBody>

              <AlertDialogFooter className="flex gap-6 font-bold text-lg">
                {cancelBtn && (
                  <button
                    className="flex gap-1 items-center px-3 border-1 transition duration-200 border-gray-400 justify-center rounded-lg text-gray-400 hover:bg-gray-400 hover:text-white"
                    ref={cancelRef}
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                )}

                <button
                  className="border border-button-stroke-violet px-6 py-2 rounded-lg hover:bg-button-stroke-violet hover:text-white transition duration-300"
                  onClick={() => {
                    confirmCallBack();
                    onClose();
                  }}
                >
                  {confirmBtnTitle}
                </button>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default HederaAlertDialog;
