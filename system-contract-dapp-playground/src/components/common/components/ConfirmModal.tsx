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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/react';

interface PageProps {
  isOpen: boolean;
  modalBody: any;
  onClose: () => void;
  modalHeader: string;
  handleAcknowledge: any;
}

const ConfirmModal = ({ isOpen, modalBody, onClose, modalHeader, handleAcknowledge }: PageProps) => {
  return (
    <Modal isOpen={isOpen} isCentered onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        className="h-fit flex flex-col gap-3 rounded-xl drop-shadow-xl
                bg-secondary text-white font-styrene w-[30rem]"
      >
        <ModalHeader>{modalHeader}</ModalHeader>
        <ModalCloseButton />

        {/* break line */}
        <hr className="border-t border-white/40 -mt-3" />

        <ModalBody>{modalBody}</ModalBody>

        <ModalFooter>
          <button
            onClick={handleAcknowledge}
            className="border border-button-stroke-violet px-6 py-2 rounded-lg font-medium hover:bg-button-stroke-violet hover:text-white transition duration-300"
          >
            Acknowledge
          </button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmModal;
