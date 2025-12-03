import { supabase } from "@/api/supabaseClient";
import { useNavigate } from "react-router-dom";
import StatCard from "@/components/ui/statCard";
import { DataTableDemo } from "@/components/ui/pollsTable";
import { toast } from "sonner";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { CgPoll } from "react-icons/cg";

import {
  SquareKanban,
  Activity,
  Vote,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
    endedPolls: 0,
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const now = new Date().toISOString();

      const [totalRes, activeRes, endedRes, votesRes] = await Promise.all([
        // 1. Total Polls created by user
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id),

        // 2. Active Polls (End date is in future OR null)
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .or(`end_at.gt.${now},end_at.is.null`),

        // 3. Ended Polls (End date is in past)
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .lt("end_at", now),

        // 4. Total Votes (Assuming a 'poll_votes' table exists linked to polls)
        supabase
          .from("polls")
          .select("poll_votes(count)")
          .eq("created_by", user.id),
      ]);

      // Calculate total votes from the nested structure
      const totalVotesCount = votesRes.data
        ? votesRes.data.reduce((acc: number, curr: any) => {
            return acc + (curr.poll_votes?.[0]?.count || 0);
          }, 0)
        : 0;

      setStats({
        totalPolls: totalRes.count || 0,
        activePolls: activeRes.count || 0,
        endedPolls: endedRes.count || 0,
        totalVotes: totalVotesCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const statData = [
    {
      title: "Total Polls",
      icon: SquareKanban,
      iconColor: "text-blue-600",
      data: stats.totalPolls,
    },
    {
      title: "Active Polls",
      icon: Activity,
      iconColor: "text-green-600",
      data: stats.activePolls,
    },
    {
      title: "Total Votes",
      icon: Vote,
      iconColor: "text-purple-600",
      data: stats.totalVotes,
    },
    {
      title: "Ended Polls",
      icon: CheckCircle2,
      iconColor: "text-neutral-600",
      data: stats.endedPolls,
    },
  ];

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
            icon={loading ? Loader2 : stat.icon}
            iconColor={stat.iconColor}
            data={loading ? 0 : stat.data}
          />
        ))}
      </div>
      <DataTableDemo />
    </div>
  );
}
