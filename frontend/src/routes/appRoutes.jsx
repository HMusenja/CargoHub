// // AppRoutes.jsx
// import { Routes, Route } from "react-router-dom";
// import AppShell from "@/components/layout/AppShell";
// import Home from "@/pages/Home";
// import MyShipments from "@/pages/MyShipment";
// import NewShipment from "@/pages/new-shipment/NewShipment";
// import QuotePage from "@/pages/QuotePage";
// import Track from "@/pages/Track";
// import BookPage from "@/pages/BookPage";
// import BookingConfirmed from "@/pages/BookingConfirmed";
// import RequireRole from "@/components/auth/RequireRole";
// import ScanEntry from "@/pages/manage/ScanEntry";

// // NEW
// import { BackofficeProvider } from "@/context/BackofficeContext";
// import BackofficeRoutes from "@/routes/BackofficeRoutes";

// export default function AppRoutes() {
//   return (
//     <AppShell>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/shipments" element={<MyShipments />} />
//         <Route path="/shipments/new" element={<NewShipment />} />
//         <Route path="/quote" element={<QuotePage />} />
//         <Route path="/track" element={<Track />} />
//         <Route path="/track/:ref" element={<Track />} />
//         <Route path="/book" element={<BookPage />} />
//         <Route path="/booking/confirmed" element={<BookingConfirmed />} />

//         {/* legacy direct scan route */}
//         <Route
//           path="/manage/scan"
//           element={
//             <RequireRole roles={["staff", "admin"]}>
//               <ScanEntry />
//             </RequireRole>
//           }
//         />

//         {/* NEW: mount the lightweight module */}
//         <Route
//           path="/backoffice/*"
//           element={
//             <RequireRole roles={["staff", "admin"]}>
//               <BackofficeProvider>
//                 <BackofficeRoutes />
//               </BackofficeProvider>
//             </RequireRole>
//           }
//         />
//       </Routes>
//     </AppShell>
//   );
// }


import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import RequireRole from "@/components/auth/RequireRole";

import PublicRoutes from "@/routes/PublicRoutes";
import BackofficeRoutes from "@/routes/BackofficeRoutes";
import DashboardRoutes from "@/routes/DashboardRoutes";

import { BackofficeProvider } from "@/context/BackofficeContext";
import ScanEntry from "@/pages/manage/ScanEntry";

export default function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        {/* Public */}
        <Route path="/*" element={<PublicRoutes />} />

        {/* Legacy direct scan */}
        <Route
          path="/manage/scan"
          element={
            <RequireRole roles={["staff", "admin"]}>
              <ScanEntry />
            </RequireRole>
          }
        />

        {/* Backoffice */}
        <Route
          path="/backoffice/*"
          element={
            <RequireRole roles={["staff", "admin"]}>
              <BackofficeProvider>
                <BackofficeRoutes />
              </BackofficeProvider>
            </RequireRole>
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard/*"
          element={
            <RequireRole roles={["customer", "staff", "driver", "admin"]}>
              <DashboardRoutes />
            </RequireRole>
          }
        />
      </Routes>
    </AppShell>
  );
}
