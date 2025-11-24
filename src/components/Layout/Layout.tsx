import Header from "./Header";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div>
      <Header />
      <main className="w-full flex-1 flex flex-col p-6 md:p-10 lg:px-20 lg:py-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;
