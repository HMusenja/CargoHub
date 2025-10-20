import { Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";

// Lazy imports
const Home = lazy(() => import("@/pages/Home"));
const QuotePage = lazy(() => import("@/pages/QuotePage"));
const Track = lazy(() => import("@/pages/Track"));
const BookPage = lazy(() => import("@/pages/BookPage"));
const BookingConfirmed = lazy(() => import("@/pages/BookingConfirmed"));
const MyShipments = lazy(() => import("@/pages/MyShipment"));
const NewShipment = lazy(() => import("@/pages/new-shipment/NewShipment"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));

export default function PublicRoutes() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">Loading...</div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:ref" element={<Track />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/booking/confirmed" element={<BookingConfirmed />} />
        <Route path="/shipments" element={<MyShipments />} />
        <Route path="/shipments/new" element={<NewShipment />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* fallback for unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
