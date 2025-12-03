import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  X,
  Copy,
  Share2,
  Edit,
  Trash2,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/api/supabaseClient";
import { submitVote, hasVoted, getPollResults } from "@/lib/analytics";
import { toast } from "sonner";

type Poll = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  created_at: string;
  total_votes: number;
  status: "active" | "upcoming" | "past";
};

type PollOption = {
  id: string;
  text: string;
  votes: number;
  percentage: number;
};

type AnalyticsData = {
  totalViews: number;
  totalVotes: number;
  uniqueVoters: number;
  conversionRate: number;
  devices: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  dailyActivity: Array<{
    date: string;
    views: number;
    votes: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    votes: number;
  }>;
};

interface PollDetailModalProps {
  pollId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function PollDetailModal({
  pollId,
  isOpen,
  onClose,
  onDeleted,
}: PollDetailModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("results");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [isLoadingPoll, setIsLoadingPoll] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch poll data
  useEffect(() => {
    if (!isOpen || !pollId) return;

    const fetchPollData = async () => {
      setIsLoadingPoll(true);
      try {
        // Fetch poll details
        const { data: pollData, error: pollError } = await supabase
          .from("polls")
          .select("*")
          .eq("id", pollId)
          .single();

        if (pollError) throw pollError;

        // Determine status
        const now = new Date();
        const startDate = new Date(pollData.start_at);
        const endDate = pollData.end_at ? new Date(pollData.end_at) : null;

        let status: "active" | "upcoming" | "past";
        if (now < startDate) {
          status = "upcoming";
        } else if (endDate && now > endDate) {
          status = "past";
        } else {
          status = "active";
        }

        // Get total votes
        const { count: voteCount } = await supabase
          .from("poll_votes")
          .select("*", { count: "exact", head: true })
          .eq("poll_id", pollId);

        setPoll({
          id: pollData.id,
          title: pollData.title,
          description: pollData.description,
          start_at: pollData.start_at,
          end_at: pollData.end_at,
          created_at: pollData.created_at,
          total_votes: voteCount || 0,
          status,
        });

        // Fetch poll results
        const results = await getPollResults(pollId);
        if (results) {
          setOptions(results.results);
        }

        // Check if user has voted
        const voted = await hasVoted(pollId);
        setUserHasVoted(voted);
      } catch (error) {
        console.error("Error fetching poll:", error);
        toast.error("Failed to load poll");
      } finally {
        setIsLoadingPoll(false);
      }
    };

    fetchPollData();
  }, [pollId, isOpen]);

  // Fetch analytics data
  useEffect(() => {
    if (!isOpen || !pollId || activeTab !== "analytics") return;

    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      try {
        // Fetch analytics from Supabase
        const { data, error } = await supabase
          .from("analytics")
          .select("*")
          .eq("poll_id", pollId);

        if (error) throw error;

        // Process analytics data
        // For now, using mock data
        setAnalytics({
          totalViews: 3456,
          totalVotes: 1247,
          uniqueVoters: 1189,
          conversionRate: 36.1,
          devices: [
            { type: "Desktop", count: 687, percentage: 55 },
            { type: "Mobile", count: 435, percentage: 35 },
            { type: "Tablet", count: 125, percentage: 10 },
          ],
          dailyActivity: [
            { date: "Nov 24", views: 234, votes: 87 },
            { date: "Nov 25", views: 312, votes: 124 },
            { date: "Nov 26", views: 289, votes: 98 },
            { date: "Nov 27", views: 401, votes: 156 },
            { date: "Nov 28", views: 378, votes: 142 },
            { date: "Nov 29", views: 456, votes: 178 },
            { date: "Nov 30", views: 498, votes: 189 },
          ],
          hourlyDistribution: [
            { hour: "12 AM", votes: 12 },
            { hour: "3 AM", votes: 8 },
            { hour: "6 AM", votes: 23 },
            { hour: "9 AM", votes: 89 },
            { hour: "12 PM", votes: 156 },
            { hour: "3 PM", votes: 234 },
            { hour: "6 PM", votes: 198 },
            { hour: "9 PM", votes: 134 },
          ],
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoadingAnalytics(false);
      }
    };

    fetchAnalytics();

    // Set up real-time subscription
    const channel = supabase
      .channel(`analytics-${pollId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "analytics",
          filter: `poll_id=eq.${pollId}`,
        },
        () => {
          fetchAnalytics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId, isOpen, activeTab]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-700 border-green-200",
      upcoming: "bg-blue-100 text-blue-700 border-blue-200",
      past: "bg-gray-100 text-gray-600 border-gray-200",
    };

    return (
      <Badge
        variant="outline"
        className={cn("capitalize", variants[status as keyof typeof variants])}
      >
        <Clock className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
    toast.success("Link copied to clipboard!");
  };

  const handleDelete = async () => {
    if (!pollId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from("polls").delete().eq("id", pollId);

      if (error) throw error;

      toast.success("Poll deleted successfully");
      setIsDeleteDialogOpen(false);
      onClose();
      if (onDeleted) onDeleted();
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = (platform: string) => {
    const pollUrl = `${window.location.origin}/poll/${pollId}`;
    const text = `Vote on: ${poll?.title}`;

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(pollUrl)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          pollUrl
        )}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          pollUrl
        )}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(
          text
        )}&body=${encodeURIComponent(`Check out this poll: ${pollUrl}`)}`;
        break;
      case "copy":
        handleCopyLink();
        setIsShareDialogOpen(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      setIsShareDialogOpen(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedOption || !pollId) return;

    setIsSubmittingVote(true);
    const result = await submitVote(pollId, selectedOption);

    if (result.success) {
      toast.success("Vote submitted successfully!");
      setUserHasVoted(true);

      const results = await getPollResults(pollId);
      if (results) {
        setOptions(results.results);
        if (poll) {
          setPoll({ ...poll, total_votes: results.totalVotes });
        }
      }
    } else {
      toast.error(result.error || "Failed to submit vote");
    }

    setIsSubmittingVote(false);
  };

  const maxDailyVotes = analytics
    ? Math.max(...analytics.dailyActivity.map((d) => d.votes))
    : 0;
  const maxHourlyVotes = analytics
    ? Math.max(...analytics.hourlyDistribution.map((h) => h.votes))
    : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-semibold font-grotesk text-neutral-800">
                {poll?.title}
              </h2>
              {getStatusBadge(poll?.status || "active")}
            </div>
            {poll?.description && (
              <p className="text-sm text-neutral-600 mt-2">
                {poll.description}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 ml-4"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Results Tab */}
          <TabsContent value="results" className="flex-1 overflow-y-auto mt-0">
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-neutral-600 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Total Votes</span>
                  </div>
                  <p className="text-2xl font-semibold text-neutral-800">
                    {poll?.total_votes?.toLocaleString() || "0"}
                  </p>
                </div>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-neutral-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Time Remaining</span>
                  </div>
                  <p className="text-2xl font-semibold text-neutral-800">
                    32 days
                  </p>
                </div>
              </div>

              {/* Poll Duration */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">
                  Poll Duration
                </h3>
                <p className="text-sm text-neutral-600">
                  {poll?.start_at ? formatDate(poll.start_at) : "No start date"}
                  -{poll?.end_at ? formatDate(poll.end_at) : "No end date"}
                </p>
              </div>

              {/* Poll Results */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                  Results
                </h3>
                <div className="space-y-4">
                  {options.map((option, index) => (
                    <div
                      key={option.id}
                      className={cn(
                        "border rounded-lg p-4 transition-all cursor-pointer hover:border-teal-300",
                        selectedOption === option.id
                          ? "border-teal-500 bg-teal-50"
                          : "border-neutral-200"
                      )}
                      onClick={() =>
                        !userHasVoted && setSelectedOption(option.id)
                      }
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm",
                              index === 0
                                ? "bg-amber-100 text-amber-700"
                                : index === 1
                                ? "bg-slate-100 text-slate-700"
                                : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-neutral-100 text-neutral-700"
                            )}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-neutral-800">
                              {option.text}
                            </p>
                          </div>
                          {selectedOption === option.id && (
                            <CheckCircle2 className="w-5 h-5 text-teal-600" />
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-semibold text-neutral-800">
                            {option.percentage}%
                          </p>
                          <p className="text-xs text-neutral-500">
                            {option.votes.toLocaleString()} votes
                          </p>
                        </div>
                      </div>
                      <Progress value={option.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Vote Button */}
              {poll?.status === "active" && !userHasVoted && (
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white"
                  size="lg"
                  disabled={!selectedOption || isSubmittingVote}
                  onClick={handleSubmitVote}
                >
                  {isSubmittingVote ? "Submitting..." : "Submit Vote"}
                </Button>
              )}

              {userHasVoted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-900">
                    You've already voted on this poll
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent
            value="analytics"
            className="flex-1 overflow-y-auto mt-0"
          >
            <div className="p-6 space-y-6">
              {isLoadingAnalytics ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-neutral-500">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MousePointer className="w-4 h-4 text-blue-600" />
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +12%
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600 mb-1">
                        Total Views
                      </p>
                      <p className="text-2xl font-bold text-neutral-800">
                        {analytics.totalViews.toLocaleString()}
                      </p>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Users className="w-4 h-4 text-purple-600" />
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200 text-xs"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          +15%
                        </Badge>
                      </div>
                      <p className="text-xs text-neutral-600 mb-1">
                        Unique Voters
                      </p>
                      <p className="text-2xl font-bold text-neutral-800">
                        {analytics.uniqueVoters.toLocaleString()}
                      </p>
                    </Card>
                  </div>

                  {/* Conversion Rate */}
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-sm text-neutral-600">
                        Conversion Rate
                      </p>
                    </div>
                    <p className="text-2xl font-semibold text-neutral-800">
                      {analytics.conversionRate}%
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Views to votes
                    </p>
                  </Card>

                  {/* Device Breakdown */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-neutral-800 mb-4">
                      Device Distribution
                    </h3>
                    <div className="space-y-3">
                      {analytics.devices.map((device) => (
                        <div key={device.type} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {device.type === "Desktop" && (
                                <Monitor className="w-4 h-4 text-neutral-600" />
                              )}
                              {device.type === "Mobile" && (
                                <Smartphone className="w-4 h-4 text-neutral-600" />
                              )}
                              {device.type === "Tablet" && (
                                <Tablet className="w-4 h-4 text-neutral-600" />
                              )}
                              <span className="font-medium text-neutral-700">
                                {device.type}
                              </span>
                            </div>
                            <span className="text-neutral-600">
                              {device.count} ({device.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div
                              className="bg-teal-500 h-2 rounded-full"
                              style={{ width: `${device.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Daily Activity */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-neutral-800 mb-4">
                      Daily Activity (Last 7 Days)
                    </h3>
                    <div className="space-y-3">
                      {analytics.dailyActivity.slice(-5).map((day) => (
                        <div key={day.date} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-neutral-700">
                              {day.date}
                            </span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-neutral-500">
                                {day.views} views
                              </span>
                              <span className="text-teal-600 font-medium">
                                {day.votes} votes
                              </span>
                            </div>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div
                              className="bg-teal-500 h-2 rounded-full"
                              style={{
                                width: `${(day.votes / maxDailyVotes) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Hourly Distribution */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-neutral-800 mb-4">
                      Voting by Hour
                    </h3>
                    <div className="flex items-end justify-between gap-1 h-32">
                      {analytics.hourlyDistribution.map((hour) => (
                        <div
                          key={hour.hour}
                          className="flex flex-col items-center flex-1 gap-1 group"
                        >
                          <div className="w-full bg-neutral-100 rounded-t flex items-end justify-center relative">
                            <div
                              className="w-full bg-teal-500 rounded-t transition-all hover:bg-teal-600"
                              style={{
                                height: `${
                                  (hour.votes / maxHourlyVotes) * 100
                                }px`,
                              }}
                            />
                            <div className="absolute -top-6 bg-neutral-800 text-white text-xs py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {hour.votes}
                            </div>
                          </div>
                          <p className="text-[10px] text-neutral-500">
                            {hour.hour.split(" ")[0]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12 text-neutral-500">
                  No analytics data available
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => toast.info("Edit functionality coming soon")}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="text-red-600 hover:text-red-700"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Poll</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{poll?.title}"? This action
              cannot be undone. All votes and data associated with this poll
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Poll</DialogTitle>
            <DialogDescription>
              Share this poll with your audience
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("twitter")}
            >
              <Twitter className="w-4 h-4 text-sky-500" />
              Twitter
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("linkedin")}
            >
              <Linkedin className="w-4 h-4 text-blue-700" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("email")}
            >
              <Mail className="w-4 h-4 text-neutral-600" />
              Email
            </Button>
          </div>
          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleShare("copy")}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
