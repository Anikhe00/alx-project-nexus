import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-grotesk">Dashboard</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
