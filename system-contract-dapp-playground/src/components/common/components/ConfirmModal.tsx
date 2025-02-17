// SPDX-License-Identifier: Apache-2.0

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
