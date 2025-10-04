import { Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Home from "@/pages/Home"; 
import MyShipments from "@/pages/MyShipment";
import NewShipment from "@/pages/new-shipment/NewShipment";
// import Quote from "@/pages/Quote";
import QuotePage from "@/pages/QuotePage";
import Track from "@/pages/Track";
import BookPage from "@/pages/BookPage"
import BookingConfirmed from "@/pages/BookingConfirmed";


export default function AppRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shipments" element={<MyShipments />} />
        <Route path="/shipments/new" element={<NewShipment />} />
        <Route path="/quote" element={<QuotePage />} />
        <Route path="/track" element={<Track />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/booking/confirmed" element={<BookingConfirmed />} />
     
        
      </Routes>
    </AppShell>
  );
}