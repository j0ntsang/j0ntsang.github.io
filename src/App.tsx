import "./App.css";

import { Home } from "./pages/Home";
import React from "react";
import useTitleAnimation from "./hooks/useTitleAnimation";

export const App: React.VFC = () => {
  useTitleAnimation("hash_dot");

  return <Home />;
};
