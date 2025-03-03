import "./App.css";

import React, { useState } from "react";
import { Route, Switch } from "react-router-dom";

import { Home } from "./pages/Home";
import useTitleAnimation from "./hooks/useTitleAnimation";

export const App: React.VFC = () => {
  const [animationType] = useState("progress");

  useTitleAnimation(animationType);

  return (
    <Switch>
      <Route exact path="/" component={Home} />
    </Switch>
  );
};
