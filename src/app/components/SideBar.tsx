"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open: any) => (event: any) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setIsOpen(open);
  };

  return (
    <div>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={toggleDrawer(true)}
        className="top-0 sticky"
        size="large"
      >
        <div className="bg-gray-700 p-2 border rounded-full">
          <KeyboardArrowRightIcon fontSize="large" />
        </div>
      </IconButton>
      <Drawer anchor="left" open={isOpen} onClose={toggleDrawer(false)}>
        <IconButton
          onClick={toggleDrawer(false)}
          className="text-white absolute top-0 right-0"
        >
          <KeyboardArrowLeftIcon />
        </IconButton>
        <div className="h-screen bg-gray-900 p-4 w-48 lg:w-64 text-white">
          <h1 className="text-xl font-bold mb-4">Commands</h1>
          <List>
            <ListItem button onClick={toggleDrawer(false)}>
              <Link href="#character-info">
                <ListItemText primary="character-info" />
              </Link>
            </ListItem>
            <ListItem button onClick={toggleDrawer(false)}>
              <Link href="#character-stats">
                <ListItemText primary="character-stats" />
              </Link>
            </ListItem>
            <ListItem button onClick={toggleDrawer(false)}>
              <Link href="#user-stats">
                <ListItemText primary="user-stats" />
              </Link>
            </ListItem>
            <ListItem button onClick={toggleDrawer(false)}>
              <Link href="#user-characters">
                <ListItemText primary="user-characters" />
              </Link>
            </ListItem>
          </List>
        </div>
      </Drawer>
    </div>
  );
};

export default Sidebar;
