import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StatCard from "./statCard";

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
  Mail,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { submitVote, hasVoted, getPollResults } from "@/lib/analytics";
import { usePollsContext } from "@/context/PollsContext";
import PollAnalytics from "@/components/ui/PollAnalytics";
import type { Poll as ContextPoll } from "@/context/PollsContext";
import { toast } from "sonner";

// Local type for the view
type PollView = ContextPoll & {
  status: "active" | "upcoming" | "past";
  total_votes: number;
};

type PollOption = {
  id: string;
  text: string;
  votes: number;
  percentage: number;
};

interface PollDetailModalProps {
  pollId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PollDetailModal({
  pollId,
  isOpen,
  onClose,
}: PollDetailModalProps) {
  const { polls, deletePoll, getPollStatus, refreshPolls, incrementView } =
    usePollsContext();

  useEffect(() => {
    if (isOpen && pollId) {
      incrementView(pollId);
    }
  }, [isOpen, pollId, incrementView]);

  // Local State
  const [poll, setPoll] = useState<PollView | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("results");
  const [options, setOptions] = useState<PollOption[]>([]);

  // Loading States
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dialog States
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [userHasVoted, setUserHasVoted] = useState(false);

  // Sync Poll Data & Fetch Detailed Results
  useEffect(() => {
    if (!isOpen || !pollId) return;

    const existingPoll = polls.find((p) => p.id === pollId);

    if (existingPoll) {
      setPoll({
        ...existingPoll,
        total_votes: existingPoll.votes,
        status: getPollStatus(existingPoll) as "active" | "upcoming" | "past",
      });
    }

    // Fetch Detailed Results (Options & Vote Status)
    const fetchDetailedResults = async () => {
      setIsLoadingResults(true);
      try {
        // Fetch poll results (breakdown by option)
        const results = await getPollResults(pollId);
        if (results) {
          setOptions(results.results);
          // Update total votes if api returns newer data than context
          if (existingPoll) {
            setPoll((prev) =>
              prev ? { ...prev, total_votes: results.totalVotes } : null
            );
          }
        }

        // Check if user has voted
        const voted = await hasVoted(pollId);
        setUserHasVoted(voted);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setIsLoadingResults(false);
      }
    };

    fetchDetailedResults();
  }, [pollId, isOpen, polls, getPollStatus]);

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
      const success = await deletePoll(pollId);
      if (success) {
        setIsDeleteDialogOpen(false);
        onClose();
      }
    } finally {
      setIsDeleting(false);
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
      refreshPolls();
    } else {
      toast.error(result.error || "Failed to submit vote");
    }

    setIsSubmittingVote(false);
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl md:text-2xl lg:text-2xl font-semibold font-grotesk text-neutral-800">
                {poll?.title || "Loading..."}
              </h2>
              {poll && getStatusBadge(poll.status)}
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
                <StatCard
                  icon={Users}
                  title="Total Votes"
                  data={poll?.total_votes?.toLocaleString() || "0"}
                />

                <StatCard
                  icon={Clock}
                  title="Time Remaining"
                  data={poll?.end_at ? "Active" : "Open Ended"}
                />
              </div>

              {/* Poll Duration */}
              <div className="bg-white border font-grotesk border-neutral-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">
                  Poll Duration
                </h3>
                <p className="text-sm text-neutral-600">
                  {poll?.start_at ? formatDate(poll.start_at) : "No start date"}{" "}
                  - {poll?.end_at ? formatDate(poll.end_at) : "No end date"}
                </p>
              </div>

              {/* Poll Results List */}
              <div className="font-grotesk">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                  Results
                </h3>
                {isLoadingResults ? (
                  <div className="text-center py-8 text-neutral-400">
                    Loading options...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {options.map((option, index) => (
                      <div
                        key={option.id}
                        className={cn(
                          "border rounded-lg p-4 transition-all cursor-pointer hover:border-teal-300 hover:bg-teal-50",
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
                        <Progress value={option.percentage} className="h-2 " />
                      </div>
                    ))}
                  </div>
                )}
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
              <PollAnalytics
                pollId={pollId!}
                totalVotes={poll?.total_votes || 0}
                viewCount={(poll as any)?.view_count || 0}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="border-t font-grotesk border-neutral-200 p-4">
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

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Poll</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{poll?.title}"? This action
              cannot be undone.
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
              <Twitter className="w-4 h-4 text-sky-500" /> Twitter
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("facebook")}
            >
              <Facebook className="w-4 h-4 text-blue-600" /> Facebook
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("linkedin")}
            >
              <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 justify-start"
              onClick={() => handleShare("email")}
            >
              <Mail className="w-4 h-4 text-neutral-600" /> Email
            </Button>
          </div>
          <div className="border-t pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleShare("copy")}
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
