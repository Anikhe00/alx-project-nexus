import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/ui/statCard";
import { SquareKanban } from "lucide-react";

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
      <h1 className="text-2xl font-grotesk">Dashboard</h1>
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
    </div>
  );
}
