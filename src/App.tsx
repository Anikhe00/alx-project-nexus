import AppRouter from "./router/AppRouter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { PollsProvider } from "@/context/PollsContext";

function App() {
  return (
    <AuthProvider>
      <PollsProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            className: "font-grotesk border border-neutral-200 rounded-none",
            duration: 3000,
          }}
        />
        <AppRouter />
      </PollsProvider>
    </AuthProvider>
  );
}

export default App;
