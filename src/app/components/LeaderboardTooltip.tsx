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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function App() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <div className="relative mb-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-1">
            Leaderboards
          </h1>
        </div>
        <button
          onClick={onOpen}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-300 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800/30"
          title="Update Schedule"
        >
          <InfoOutlinedIcon className="w-5 h-5" />
        </button>
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
