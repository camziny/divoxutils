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
            Group Builder
          </h1>
        </Button>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent className="bg-gray-500">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1"></ModalHeader>
              <ModalBody className="bg-gray-500">
                <p className="text-lg font-semibold">Building Your Group</p>
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Add Users:</strong> Start by adding users to your
                    roster.
                  </li>
                  <li>
                    <strong>Select a Realm:</strong> Once you choose a realm,
                    characters will filtered accordingly.
                  </li>
                  <li>
                    <strong>Privacy Settings:</strong> Want to keep your comp
                    exclusive? Check the &quot;Private&quot; box to limit
                    visibility to only those in the Active Group.
                  </li>
                  <li>
                    <strong>Form Your Active Group:</strong> Drag and drop users
                    from the Roster into the Active Group.
                  </li>
                  <li>
                    <strong>Assign Characters:</strong> For each user in the
                    Active Group, select a character.
                  </li>
                  <li>
                    <strong>Save and Share:</strong> Hit &quot;Save Group&quot;
                    to lock in your choices. Click &quot;Share Group&quot; to
                    get a shareable link.
                  </li>
                </ul>
              </ModalBody>
              <ModalFooter></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
