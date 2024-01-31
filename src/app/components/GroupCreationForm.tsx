"use client";
import React, { useState } from "react";
import { Input, Button } from "@nextui-org/react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const GroupCreationForm: React.FC = () => {
  const [groupName, setGroupName] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleGroupNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGroupName(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSnackbarOpen(false);

    try {
      const response = await fetch("/api/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSnackbarMessage(`Group created successfully: ${data.name}`);
      setSnackbarSeverity("success");
      setGroupName("");
    } catch (error: any) {
      setSnackbarMessage(
        `Error creating group: ${error.message || error.toString()}`
      );
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <Input
          size="md"
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          classNames={{
            label: "text-gray-500 dark:text-gray-300",
            input: [
              "bg-transparent",
              "text-gray-800 dark:text-gray-200",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            ],
            innerWrapper: "bg-transparent",
            inputWrapper: [
              "shadow-xl",
              "bg-gray-800",
              "dark:bg-gray-700",
              "hover:bg-gray-700 dark:hover:bg-gray-600",
              "group-data-[focused=true]:bg-gray-800 dark:group-data-[focused=true]:bg-gray-700",
              "focus:border-indigo-600",
              "!cursor-text",
            ],
          }}
        />
        <Button
          type="submit"
          className="bg-indigo-600 text-white w-1/3 self-center"
        >
          Create Group
        </Button>
      </form>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default GroupCreationForm;
