import "./App.css";

import { Route, Switch } from "react-router-dom";

import { Home } from "./pages/Home";
import React from "react";
import { Test } from "./pages/Test";

export const App: React.VFC = () => {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/test" component={Test} />
    </Switch>
  );
};
