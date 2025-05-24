import "./index.css";

import { App } from "./App";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

const appRoot = document.getElementById("react")!;
const root = createRoot(appRoot);

const AppWithRouter = () => {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};
root.render(<AppWithRouter />);
