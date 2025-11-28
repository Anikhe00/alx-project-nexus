import { Button } from "../ui/button";
import Logo from "../ui/Logo";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import ProfileCard from "../ui/profileCard";

const Header = () => {
  const [isProfileActive, setIsProfileActive] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user, loading } = useAuthContext();
  const [fullName, setFullName] = useState<string>("");

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  function handleProfileClick() {
    setIsProfileActive(!isProfileActive);
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data?.full_name) {
        setFullName(data.full_name);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Function to get initials from full name
  const getInitials = (name: string) => {
    if (!name) return "U";

    const names = name.trim().split(" ");
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    const firstInitial = names[0].charAt(0).toUpperCase();
    const lastInitial = names[names.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  };

  if (loading) return null;

  return (
    <header className="sticky bg-neutral-50 top-0 z-50 flex items-start justify-between px-6 md:px-10 lg:px-40 py-4 border-b border-neutral-100">
      {/* Profile Card */}
      <ProfileCard onClick={logout} isActive={isProfileActive} />

      {/* Logo */}
      <Logo />

      {/* Nav Links */}
      {user && <div></div>}

      {/* Buttons */}
      {!user ? (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            className="hover:bg-teal-50 cursor-pointer text-teal-600 hover:text-teal-600 font-grotesk hover:border-teal-300"
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
        <div className="flex gap-3 items-center justify-center">
          <Avatar
            className="font-grotesk cursor-pointer"
            onClick={handleProfileClick}
          >
            <AvatarFallback className="bg-teal-200 font-medium text-teal-800">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <Button
            className="bg-teal-600 hover:bg-teal-500 text-white hover:teal-sky-500 font-geist cursor-pointer"
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
