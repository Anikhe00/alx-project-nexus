import { SidebarProvider } from "../ui/sidebar";
import AppSidebar from "./AppSidebar";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full px-6 mt-15 lg:mt-0 md:px-10 lg:px-40 py-6 lg:py-10">
        {/* <SidebarTrigger /> */}

        {children}
      </main>
    </SidebarProvider>
  );
};

export default Layout;
