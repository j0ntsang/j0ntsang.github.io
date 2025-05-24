import "./index.css";

import { App } from "./App";
import { createRoot } from "react-dom/client";

const appRoot = document.getElementById("react")!;
const root = createRoot(appRoot);

root.render(<App />);
