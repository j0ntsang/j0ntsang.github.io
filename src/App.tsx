import "./App.css";

import React, { useState } from "react";

import { Home } from "./pages/Home";
import useTitleAnimation from "./hooks/useTitleAnimation";

export const App: React.VFC = () => {
  const [animationType] = useState("hash_dot");

  useTitleAnimation(animationType);

  return <Home />;
};
