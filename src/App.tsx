import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Home } from './pages/Home';

import './App.css';

export const App: React.VFC = () => {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
    </Switch>
  );
};
