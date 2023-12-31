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
      <div className="flex justify-center items-center space-x-4">
        <Button
          onPress={onOpen}
          size="sm"
          className="flex items-center justify-center bg-gray-900/90 text-indigo-500"
          endContent={<InfoIcon />}
        >
          <h1 className="text-3xl font-bold text-white text-center">
            Leaderboards
          </h1>
        </Button>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="bg-gray-900">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1"></ModalHeader>
              <ModalBody className="bg-gray-900">
                <p>
                  Leaderboards are updated every Monday at 5:00 AM (UTC). New
                  users or characters added during the week will be fully
                  reflected in the leaderboard calculations from the second week
                  of their registration.
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
