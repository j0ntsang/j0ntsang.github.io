import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

import './index.css';
import { App } from './App';

const appRoot = document.getElementById('root')!;
const root = createRoot(appRoot);

const AppWithRouter = () => {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
root.render(<AppWithRouter />);
