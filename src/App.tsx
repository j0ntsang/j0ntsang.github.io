import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { BasicEnglish } from './pages/BasicEnglish';

import './App.css';

export const App: React.VFC = () => {
  return (
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path="/basic" component={BasicEnglish} />
    </Switch>
  );
};
