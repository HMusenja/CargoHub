// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

import { AuthProvider } from "./context/AuthContext";
import { ShipmentProvider } from "./context/ShipmentContext";
import { PaymentProvider } from "./context/PaymentContext";
import { TrackingProvider } from "./context/TrackingContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ShipmentProvider>
          <PaymentProvider>
            <TrackingProvider>
              <App />
            </TrackingProvider>
           </PaymentProvider>
        </ShipmentProvider>
    </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

