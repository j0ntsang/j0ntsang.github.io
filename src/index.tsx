import * as React from 'react';
import { HashRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './App';

const appRoot = document.getElementById('root')!;
const root = createRoot(appRoot);

const AppWithRouter = () => {
  return (
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
}
root.render(<AppWithRouter />);
