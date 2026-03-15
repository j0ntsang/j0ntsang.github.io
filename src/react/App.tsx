import "./App.css";

import React from "react";
import { SidebarTabs } from "./SidebarTabs";

export const App: React.VFC = () => {
  console.log("React connected");
  return <SidebarTabs />;
};
