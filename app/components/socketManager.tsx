// components/SocketManager.tsx
"use client";

import React, { useEffect } from "react";
import { useEmployeeContext } from "../contexts/employeeContext";
import socket from "../lib/socket";

const SocketManager = () => {
  const { employeeId } = useEmployeeContext();

  useEffect(() => {
    if (employeeId) {
      console.log("SocketManager emitting join for:", employeeId);
      socket.emit("join", employeeId);
    }
  }, [employeeId]);

  return null;
};

export default SocketManager;
