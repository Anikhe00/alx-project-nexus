import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";

export type Poll = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  created_at: string;
  votes: number;
  options: number;
};

type PollStatus = "all" | "active" | "upcoming" | "past";

interface PollsContextType {
  // State
  polls: Poll[];
  isLoading: boolean;
  stats: {
    totalPolls: number;
    activePolls: number;
    totalVotes: number;
    endedPolls: number;
  };

  // Functions
  fetchPolls: () => Promise<void>;
  fetchDashboardStats: () => Promise<void>;
  deletePoll: (pollId: string) => Promise<boolean>;
  getPollStatus: (poll: Poll) => PollStatus;

  // Helpers
  refreshPolls: () => void;
}

const PollsContext = createContext<PollsContextType | undefined>(undefined);

export const usePollsContext = () => {
  const context = useContext(PollsContext);
  if (!context) {
    throw new Error("usePollsContext must be used within a PollsProvider");
  }
  return context;
};

export const PollsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuthContext();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolls: 0,
    activePolls: 0,
    totalVotes: 0,
    endedPolls: 0,
  });

  // Get poll status
  const getPollStatus = useCallback((poll: Poll): PollStatus => {
    const now = new Date();
    const startDate = new Date(poll.start_at);
    const endDate = poll.end_at ? new Date(poll.end_at) : null;

    if (now < startDate) return "upcoming";
    if (endDate && now > endDate) return "past";
    return "active";
  }, []);

  // Fetch polls from Supabase
  const fetchPolls = useCallback(async () => {
    if (!user) {
      setPolls([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch polls created by current user
      const { data: pollsData, error: pollsError } = await supabase
        .from("polls")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (pollsError) throw pollsError;

      // For each poll, get vote count and option count
      const pollsWithCounts = await Promise.all(
        pollsData.map(async (poll) => {
          // Get vote count
          const { count: voteCount } = await supabase
            .from("poll_votes")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);

          // Get option count
          const { count: optionCount } = await supabase
            .from("poll_options")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", poll.id);

          return {
            id: poll.id,
            title: poll.title,
            description: poll.description,
            start_at: poll.start_at,
            end_at: poll.end_at,
            created_at: poll.created_at,
            votes: voteCount || 0,
            options: optionCount || 0,
          };
        })
      );

      setPolls(pollsWithCounts);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      const [totalRes, activeRes, endedRes, votesRes] = await Promise.all([
        // Total Polls
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id),

        // Active Polls
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .or(`end_at.gt.${now},end_at.is.null`),

        // Ended Polls
        supabase
          .from("polls")
          .select("*", { count: "exact", head: true })
          .eq("created_by", user.id)
          .lt("end_at", now),

        // Total Votes
        supabase.from("polls").select("id").eq("created_by", user.id),
      ]);

      // Get vote counts for all user's polls
      let totalVotesCount = 0;
      if (votesRes.data) {
        const pollIds = votesRes.data.map((p) => p.id);
        const { count } = await supabase
          .from("poll_votes")
          .select("*", { count: "exact", head: true })
          .in("poll_id", pollIds);
        totalVotesCount = count || 0;
      }

      setStats({
        totalPolls: totalRes.count || 0,
        activePolls: activeRes.count || 0,
        endedPolls: endedRes.count || 0,
        totalVotes: totalVotesCount,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    }
  }, [user]);

  // Delete poll
  const deletePoll = useCallback(
    async (pollId: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from("polls")
          .delete()
          .eq("id", pollId);

        if (error) throw error;

        toast.success("Poll deleted successfully");
        await fetchPolls();
        await fetchDashboardStats();
        return true;
      } catch (error) {
        console.error("Error deleting poll:", error);
        toast.error("Failed to delete poll");
        return false;
      }
    },
    [fetchPolls, fetchDashboardStats]
  );

  // Refresh polls (useful after creating/updating)
  const refreshPolls = useCallback(() => {
    fetchPolls();
    fetchDashboardStats();
  }, [fetchPolls, fetchDashboardStats]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchPolls();
      fetchDashboardStats();
    }
  }, [user, fetchPolls, fetchDashboardStats]);

  const value: PollsContextType = {
    polls,
    isLoading,
    stats,
    fetchPolls,
    fetchDashboardStats,
    deletePoll,
    getPollStatus,
    refreshPolls,
  };

  return (
    <PollsContext.Provider value={value}>{children}</PollsContext.Provider>
  );
};
