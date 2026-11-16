import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App.jsx";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/responsive.css";
import "./styles/custom-labels.css";
import "./styles/creator.css";
import "./styles/feed.css";
import "./styles/experience.css";

createRoot(document.getElementById("root")).render(<App />);
