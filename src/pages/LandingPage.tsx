import Header from "@/components/Layout/Header";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { useEffect } from "react";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <div className="font-grotesk w-full h-dvh lg:h-auto flex flex-col">
      <Header />
      <main className="w-full px-6 lg:px-25 py-10 lg:py-25 gap-8 flex-1 lg:flex-none lg:h-auto flex flex-col items-center justify-center">
        <div className="flex flex-col gap-4 items-center justify-center">
          <div className="flex w-full max-w-3xl flex-col items-center justify-center gap-2">
            <h1 className="text-3xl leading-[110%] md:text-5xl lg:text-6xl font-extrabold text-neutral-800 text-center">
              Create Polls in Seconds.{" "}
              <span className="text-teal-600">Make Decisons Faster.</span>
            </h1>
            <p className="text-base lg:text-lg max-w-xs md:max-w-lg lg:max-w-lg text-center text-neutral-600">
              A simple tool to create, share, and analyze polls instantly.
            </p>
          </div>
          <Button
            className="w-fit bg-teal-600 hover:bg-teal-500 cursor-pointer"
            onClick={() => navigate("/register")}
            size="lg"
          >
            Create a Poll
          </Button>
        </div>

        {/* Poll Image */}
        <div className="rounded-2xl md:rounded-3xl lg:rounded-4xl flex-1 max-w-[1280px] lg:flex-none md:flex-none md:h-140 lg:h-200 bg-neutral-100 w-full p-4 md:p-8 lg:p-12 border border-neutral-300">
          <div className="rounded-lg md:rounded-xl lg:rounded-2xl w-full h-full flex flex-1 bg-teal-600"></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
