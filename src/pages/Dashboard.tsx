import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/ui/statCard";
import { SquareKanban } from "lucide-react";
import { DataTableDemo } from "@/components/ui/pollsTable";

import { Button } from "@/components/ui/button";
import { CgPoll } from "react-icons/cg";

const statData = [
  {
    title: "Total Polls",
    icon: SquareKanban,
    iconColor: "text-teal-600",
    data: 2000,
  },
  {
    title: "Active Polls",
    icon: SquareKanban,
    iconColor: "text-teal-600",
    data: 2000,
  },
  {
    title: "Total Votes",
    icon: SquareKanban,
    iconColor: "text-teal-600",
    data: 2000,
  },
  {
    title: "Total Polls",
    icon: SquareKanban,
    iconColor: "text-teal-600",
    data: 2000,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold font-grotesk text-neutral-800">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Manage and track all your polls
          </p>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
          onClick={() => navigate("/polls?openForm=true")}
        >
          <CgPoll className="w-4 h-4 text-white" />
          Create Poll
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
        {statData.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            icon={stat.icon}
            iconColor={stat.iconColor}
            data={stat.data ? stat.data : 200}
          />
        ))}
      </div>
      <DataTableDemo />
    </div>
  );
}
