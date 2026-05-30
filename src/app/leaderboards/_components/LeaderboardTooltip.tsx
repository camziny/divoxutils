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

export default function LeaderboardTooltip() {
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
                <div className="space-y-4">
                  <div className="rounded-md border border-gray-800 bg-gray-800/20 px-3.5 py-2.5 text-xs text-gray-400">
                    Refreshes every 4 hours — 12a, 4a, 8a, 12p, 4p, 8p ET.
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-gray-800/60">
                      <tr>
                        <td className="py-2 pr-4 text-gray-300 font-medium whitespace-nowrap align-top">Total</td>
                        <td className="py-2 text-gray-400">All-time</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 text-gray-300 font-medium whitespace-nowrap align-top">Last Week</td>
                        <td className="py-2 text-gray-400">Resets Monday 12 AM ET.</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 text-gray-300 font-medium whitespace-nowrap align-top">This Week</td>
                        <td className="py-2 text-gray-400">Current week since Monday</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[11px] text-gray-500">
                    New users or characters added during the week will be fully
                    reflected in the leaderboard calculations from the second week
                    of their registration.
                  </p>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
