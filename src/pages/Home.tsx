import { useEffect } from "react";
import { supabase } from "../api/supabaseClient"; // ✅ IMPORT SUPABASE

const Home = () => {
  useEffect(() => {
    supabase.from("polls").select("*").then(console.log);
  }, []);
  return (
    <div className="flex items-center justify-center h-dvh w-full">
      <p className="font-bold text-purple-500">Let's get started</p>
    </div>
  );
};

export default Home;
