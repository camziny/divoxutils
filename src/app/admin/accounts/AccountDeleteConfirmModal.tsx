"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";

export type CharacterInfo = {
  id: number;
  characterName: string;
  className: string;
  realm: string;
  totalRealmPoints: number;
};

export type IdentityLink = {
  provider: string;
  providerUserId: string;
};

export type SearchResult = {
  id: number;
  clerkUserId: string;
  name: string | null;
  email: string;
  characters: CharacterInfo[];
  identityLinks: IdentityLink[];
  groupCount: number;
  claimCount: number;
};

export function getDeleteConfirmName(user: SearchResult | null): string {
  return user?.name ?? user?.clerkUserId ?? "";
}

export function isDeleteConfirmMatch(input: string, expected: string): boolean {
  return input.length > 0 && input.toLowerCase() === expected.toLowerCase();
}

type AccountDeleteConfirmModalProps = {
  confirmTarget: SearchResult;
  confirmInput: string;
  deleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirmInputChange: (value: string) => void;
  onDelete: () => void;
};

export default function AccountDeleteConfirmModal({
  confirmTarget,
  confirmInput,
  deleting,
  error,
  onClose,
  onConfirmInputChange,
  onDelete,
}: AccountDeleteConfirmModalProps) {
  const confirmName = getDeleteConfirmName(confirmTarget);
  const canConfirm = isDeleteConfirmMatch(confirmInput, confirmName);
  const [charsOpen, setCharsOpen] = useState(false);
  const discord = confirmTarget.identityLinks.find(
    (l) => l.provider === "discord"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
        <div className="px-5 pt-5 pb-4">
          <h3 className="text-sm font-medium text-gray-100">
            Delete account
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            This action is permanent and cannot be undone.
          </p>
        </div>

        <div className="border-t border-gray-800/80" />

        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          <dl className="text-xs space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Username</dt>
              <dd className="text-gray-200 font-medium text-right">
                {confirmTarget.name ?? "None"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-300 text-right">{confirmTarget.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Clerk ID</dt>
              <dd className="font-mono text-gray-400 text-[11px] text-right">
                {confirmTarget.clerkUserId}
              </dd>
            </div>
            {discord && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Discord ID</dt>
                <dd className="font-mono text-gray-400 text-right">
                  {discord.providerUserId}
                </dd>
              </div>
            )}
          </dl>

          <div className="border-t border-gray-800/60" />

          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-gray-500">Characters </span>
              <span className="text-gray-300 tabular-nums">
                {confirmTarget.characters.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Groups </span>
              <span className="text-gray-300 tabular-nums">
                {confirmTarget.groupCount}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Claims </span>
              <span className="text-gray-300 tabular-nums">
                {confirmTarget.claimCount}
              </span>
            </div>
          </div>

          {confirmTarget.characters.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setCharsOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${charsOpen ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                {charsOpen ? "Hide" : "Show"} characters
              </button>
              {charsOpen && (
                <div className="mt-2 rounded-md border border-gray-800 divide-y divide-gray-800/60">
                  {confirmTarget.characters.map((character) => (
                    <div
                      key={character.id}
                      className="px-3 py-1.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-300">
                        {character.characterName}
                        <span className="text-gray-600 ml-1.5">{character.className}</span>
                      </span>
                      <span className="text-gray-500 tabular-nums">
                        {character.totalRealmPoints.toLocaleString()} RP
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-800/60" />

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">
              Type <span className="text-gray-200">{confirmName}</span> to
              confirm
            </label>
            <Input
              value={confirmInput}
              onChange={(e) => onConfirmInputChange(e.target.value)}
              placeholder={confirmName}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        <div className="border-t border-gray-800/80" />

        <div className="px-5 py-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-md border border-gray-800 px-3 py-1.5 text-xs text-gray-400 hover:border-gray-700 hover:text-gray-200 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={!canConfirm || deleting}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
