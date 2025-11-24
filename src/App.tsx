import AppRouter from "./router/AppRouter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          className: "font-grotesk border border-neutral-200 rounded-none",
          duration: 3000,
        }}
      />
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
