import AppRoutes from "./routes/appRoutes";
import { setAxiosDefaults } from "./lib/axiosConfig";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  setAxiosDefaults()
  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
}



