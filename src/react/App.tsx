import "./App.css";

import React from "react";
import { SidebarSystemInfo } from "./SidebarSystemInfo";

export const App: React.VFC = () => {
  console.log("React connected");
  return <SidebarSystemInfo />;
};
