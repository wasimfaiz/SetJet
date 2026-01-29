"use client";

import { useEffect } from "react";
import socket from "../lib/socket";

export const useJoinSocketRoom = (employeeId: string) => {
  useEffect(() => {
    if (employeeId) {
      socket.emit("join", employeeId);
      console.log("Joining room:", employeeId);
    }

    return () => {
      socket.disconnect();
      console.log("Socket disconnected on cleanup.");
    };
  }, [employeeId]);
};
