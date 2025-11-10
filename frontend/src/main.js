import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { Toaster } from "./components/ui/sonner";
ReactDOM.createRoot(document.getElementById("root")).render(_jsxs(React.StrictMode, { children: [_jsx(App, {}), _jsx(Toaster, { richColors: true, position: "top-right" })] }));
