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
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-white">Update Schedule</h3>
              </ModalHeader>
              <ModalBody className="bg-gray-900">
                <div className="space-y-3 text-gray-300">
                  <div>
                    <p className="font-semibold text-indigo-400">Weekly Leaderboard (Total & Last Week):</p>
                    <p className="text-sm">Updates every Monday at 12:00 AM EST</p>
                  </div>
                  <div>
                    <p className="font-semibold text-indigo-400">This Week Section:</p>
                    <p className="text-sm">• Daily updates Tuesday-Sunday at 12:00 AM EST</p>
                    <p className="text-sm">• Monday updates at 12:00 PM EST</p>
                  </div>
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">
                      New users or characters added during the week will be fully
                      reflected in the leaderboard calculations from the second week
                      of their registration.
                    </p>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter></ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
