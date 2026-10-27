import React, { useEffect, useState } from "react";

import { SidebarSection } from "./SidebarSection";

type ConnectionState = {
  supported: boolean;
  effectiveType: string;
  downlink: number | "unknown";
  rtt: number | "unknown";
  saveData: boolean | "unknown";
  type: string;
};

type NetworkInformation = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  type?: string;
  addEventListener?: (
    type: "change",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => void;
  removeEventListener?: (
    type: "change",
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ) => void;
};

export const ConnectionInfo: React.VFC = () => {
  const [connection, setConnection] = useState<ConnectionState>(() => ({
    supported: typeof (navigator as any).connection !== "undefined",
    effectiveType: "unknown",
    downlink: "unknown",
    rtt: "unknown",
    saveData: "unknown",
    type: "unknown",
  }));

  useEffect(() => {
    const nav = navigator as Navigator & { connection?: NetworkInformation };
    const conn = nav.connection;

    if (!conn) return;

    const update = () => {
      setConnection({
        supported: true,
        effectiveType: conn.effectiveType || "unknown",
        downlink: typeof conn.downlink === "number" ? conn.downlink : "unknown",
        rtt: typeof conn.rtt === "number" ? conn.rtt : "unknown",
        saveData:
          typeof conn.saveData === "boolean" ? conn.saveData : "unknown",
        type: conn.type || "unknown",
      });
    };

    update();
    conn.addEventListener?.("change", update, { passive: true });

    return () => {
      conn.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <SidebarSection
      title="Connection"
      rows={[
        ["Supported", connection.supported ? "Yes" : "No"],
        ["Effective Type", connection.effectiveType],
        ["Downlink (Mbps)", connection.downlink],
        ["RTT (ms)", connection.rtt],
        ["Save Data", String(connection.saveData)],
        ["Type", connection.type],
      ]}
    />
  );
};
