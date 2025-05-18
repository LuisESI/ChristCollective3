import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { disableRuntimeErrorOverlay } from "./lib/disableErrorOverlay";

// Disable the error overlay that keeps appearing on page refresh
disableRuntimeErrorOverlay();

createRoot(document.getElementById("root")!).render(<App />);
