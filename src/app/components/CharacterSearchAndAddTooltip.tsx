"use client";
import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";
import InfoIcon from "@mui/icons-material/Info";

export default function App() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <div className="flex items-center justify-start space-x-4">
        <Button
          onPress={onOpen}
          size="sm"
          className="bg-gray-900/90 text-indigo-500 p-2"
          isIconOnly
        >
          <InfoIcon />
        </Button>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="bg-gray-900">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1"></ModalHeader>
              <ModalBody className="bg-gray-900">
                <p>
                  If you attempt to add a character that&apos;s already in your
                  list, we&apos;ll recognize it and prevent duplication. No need
                  to worry about duplicates!
                </p>
              </ModalBody>
              <ModalFooter></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
