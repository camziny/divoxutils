"use client";
import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@nextui-org/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

export default function App() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <div className="relative mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
          Leaderboards
        </h1>
        <button
          onClick={onOpen}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-300 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-800/30"
          title="Update Schedule"
        >
          <InfoOutlinedIcon className="w-5 h-5" />
        </button>
      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="top-center"
        hideCloseButton
        classNames={{ wrapper: "items-start pt-16 sm:pt-24" }}
      >
        <ModalContent className="bg-gray-900 border border-gray-800 shadow-none">
          {(onClose) => (
            <>
              <ModalHeader className="border-b border-gray-800 py-3 px-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-gray-300">Update Schedule</h3>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-300 transition-colors duration-200 p-1.5 rounded-md hover:bg-gray-800/40"
                  aria-label="Close update schedule modal"
                >
                  ×
                </button>
              </ModalHeader>
              <ModalBody className="px-4 py-4">
                <div className="divide-y divide-gray-800 text-gray-400">
                  <div className="pb-3">
                    <p className="text-xs font-medium text-gray-300 mb-1">Weekly Leaderboard (Total & Last Week):</p>
                    <p className="text-xs">Updates every Monday at 12:00 AM EST</p>
                  </div>
                  <div className="py-3">
                    <p className="text-xs font-medium text-gray-300 mb-1">This Week Section:</p>
                    <p className="text-xs">Daily updates Tuesday-Sunday at 12:00 AM EST</p>
                    <p className="text-xs">Monday updates at 12:00 PM EST</p>
                  </div>
                  <div className="pt-3">
                    <p className="text-[11px] text-gray-500">
                      New users or characters added during the week will be fully
                      reflected in the leaderboard calculations from the second week
                      of their registration.
                    </p>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
