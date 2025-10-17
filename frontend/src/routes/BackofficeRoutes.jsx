import { Routes, Route, Navigate } from "react-router-dom";
import React, { lazy, Suspense } from "react";

// lazy chunks
const BackofficeLayout = lazy(() => import("@/pages/backoffice/BackofficeLayout"));
const Board           = lazy(() => import("@/pages/backoffice/Board"));
const Scan            = lazy(() => import("@/pages/backoffice/Scan"));

export default function BackofficeRoutes() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading back-office…</div>}>
      <Routes>
        <Route element={<BackofficeLayout />}>
          <Route index element={<Board />} />
          <Route path="scan" element={<Scan />} />
          {/* catch unknown backoffice paths */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
