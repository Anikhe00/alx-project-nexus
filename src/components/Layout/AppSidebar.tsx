import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { CgPoll } from "react-icons/cg";
// import { IoSettingsOutline } from "react-icons/io5";
import { LuLayoutDashboard } from "react-icons/lu";
import { LogOut, Menu } from "lucide-react";
import Logo from "../ui/Logo";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "../ui/button";
import { useAuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LuLayoutDashboard,
  },
  {
    title: "Polls",
    url: "/polls",
    icon: CgPoll,
  },
  // {
  //   title: "Settings",
  //   url: "/settings",
  //   icon: IoSettingsOutline,
  // },
];

// Desktop Sidebar Component
function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [fullName, setFullName] = useState<string>("");

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="hidden lg:block">
      <Sidebar>
        <SidebarHeader className="border-b border-neutral-200">
          <div className="p-2">
            <Logo />
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2 px-2 py-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link to={item.url}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-neutral-200">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 p-2">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-medium text-sm">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {fullName || "User"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  <span>Logout</span>
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </div>
  );
}

// Mobile/Tablet Header with Menu
function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [fullName, setFullName] = useState<string>("");

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    setIsOpen(false);
  };

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header - Fixed at top */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-neutral-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Mobile Bottom Navigation Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="flex h-full flex-1 p-0 font-grotesk"
        >
          <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="px-6 py-3 border-b border-neutral-200">
              <Logo />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-4">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.url;

                  return (
                    <li key={item.title}>
                      <Link
                        to={item.url}
                        onClick={handleNavClick}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                          isActive
                            ? "bg-teal-100 text-teal-800 font-medium border border-teal-300"
                            : "text-neutral-700 hover:bg-neutral-100"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="border-t border-neutral-200 p-4 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 px-3 py-3 bg-neutral-50 rounded-lg">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-teal-100 text-teal-700 font-medium">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {fullName || "User"}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-11"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Main Responsive Sidebar Export
export default function AppSidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileHeader />
    </>
  );
}
