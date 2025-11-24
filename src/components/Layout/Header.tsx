import { Button } from "../ui/button";
import Logo from "../ui/Logo";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { Avatar } from "../ui/avatar";

const Header = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();

  if (loading) return null;

  return (
    <header className="sticky bg-neutral-50 top-0 z-50 flex items-start justify-between px-5 py-4 border-b border-neutral-100">
      {/* Logo */}
      <Logo />

      {/* Nav Links */}
      {user && <div></div>}

      {/* Buttons */}
      {!user ? (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            className="hover:bg-teal-50 cursor-pointer text-teal-600 hover:text-teal-600 font-geist hover:border-teal-300"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-500 text-white hover:teal-sky-500 font-geist cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-center justify-center">
          <Avatar />
          <Button
            className="rounded-none bg-teal-600 hover:bg-teal-500 text-white hover:teal-sky-500 font-geist cursor-pointer"
            onClick={() => navigate("/register")}
          >
            Create Poll
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
