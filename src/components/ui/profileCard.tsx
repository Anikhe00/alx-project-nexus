import Tab from "@/components/ui/Tab";
import { Settings, LogOut } from "lucide-react";

type ProfileCardProps = {
  onClick?: () => void;
  isActive?: boolean;
};

export default function ProfileCard({ onClick, isActive }: ProfileCardProps) {
  return (
    <aside
      className={`${
        isActive ? "flex" : "hidden"
      } flex-col gap-1 fixed right-6 md:right-10 lg:right-40 top-16 w-50 bg-white shadow-lg border border-neutral-100 rounded-lg p-2`}
    >
      <a href="/settings" className="w-full">
        <Tab tabName="Account Settings" icon={Settings} />
      </a>

      <Tab tabName="Sign out" icon={LogOut} onClick={onClick} />
    </aside>
  );
}
