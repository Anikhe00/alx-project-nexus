import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/api/supabaseClient";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        toast.error("Email verification failed.");
        navigate("/login");
        return;
      }

      toast.success("Email verified! You can now log in.");
      navigate("/login");
    };

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center font-grotesk">
      <p>Verifying your email...</p>
    </div>
  );
};

export default Callback;
