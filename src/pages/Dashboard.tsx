import { useNavigate } from "react-router-dom";
import StatCard from "@/components/ui/statCard";
import { Button } from "@/components/ui/button";
import { CgPoll } from "react-icons/cg";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SquareKanban,
  Activity,
  Vote,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Eye,
  Copy,
  Share2,
  Trash2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { usePollsContext, type Poll } from "@/context/PollsContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaFacebook, FaLinkedin, FaXTwitter } from "react-icons/fa6";
import { Mail } from "lucide-react";
import PollDetail from "@/components/ui/PollDetails";

const getStatusBadge = (status: string) => {
  const variants = {
    active: "bg-green-100 text-green-700 border-green-200",
    upcoming: "bg-blue-100 text-blue-700 border-blue-200",
    past: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-xs",
        variants[status as keyof typeof variants]
      )}
    >
      <Clock className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
};

const getTimeInfo = (poll: Poll) => {
  const now = new Date();
  const startDate = new Date(poll.start_at);
  const endDate = poll.end_at ? new Date(poll.end_at) : null;

  if (!endDate) return "No end date";

  const getPollStatus = (poll: Poll) => {
    if (now < startDate) return "upcoming";
    if (now > endDate) return "past";
    return "active";
  };

  const status = getPollStatus(poll);

  if (status === "upcoming") {
    const daysUntil = Math.ceil(
      (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Starts in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`;
  }

  if (status === "past") {
    const daysAgo = Math.ceil(
      (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `Ended ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }

  const daysRemaining = Math.ceil(
    (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return `Ends in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { polls, isLoading, stats, getPollStatus, deletePoll } =
    usePollsContext();

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [pollToShare, setPollToShare] = useState<Poll | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);

  // Get only first 5 polls for dashboard
  const recentPolls = polls.slice(0, 5);

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

  // Handle delete poll
  const handleDeletePoll = async () => {
    if (!pollToDelete) return;

    setIsDeleting(true);
    const success = await deletePoll(pollToDelete.id);
    setIsDeleting(false);

    if (success) {
      setDeleteDialogOpen(false);
      setPollToDelete(null);
    }
  };

  // Handle share to social media
  const handleShare = (platform: string) => {
    if (!pollToShare) return;

    const pollUrl = `${window.location.origin}/poll/${pollToShare.id}`;
    const shareText = `Vote on: ${pollToShare.title}`;

    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        shareText
      )}&url=${encodeURIComponent(pollUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        pollUrl
      )}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        pollUrl
      )}`,
      email: `mailto:?subject=${encodeURIComponent(
        shareText
      )}&body=${encodeURIComponent(`Check out this poll: ${pollUrl}`)}`,
    };

    if (platform === "email") {
      window.location.href = urls[platform];
    } else {
      window.open(
        urls[platform as keyof typeof urls],
        "_blank",
        "width=600,height=400"
      );
    }

    setShareDialogOpen(false);
  };

  // Handle copy link
  const handleCopyLink = (pollId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
    toast.success("Link copied to clipboard!");
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-4">
          {statData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              icon={isLoading ? Loader2 : stat.icon}
              iconColor={stat.iconColor}
              data={isLoading ? 0 : stat.data}
            />
          ))}
        </div>

        {/* Recent Polls Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-white px-4 md:px-5 lg:px-5 py-3 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold font-grotesk text-neutral-800">
              Recent Polls
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/polls")}
              className="text-teal-600 cursor-pointer hover:text-teal-700 hover:bg-teal-50"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              <p className="ml-3 text-neutral-500">Loading polls...</p>
            </div>
          ) : recentPolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SquareKanban className="w-12 h-12 text-neutral-300 mb-3" />
              <p className="text-neutral-500 font-grotesk mb-4">No polls yet</p>
              <Button
                onClick={() => navigate("/polls?openForm=true")}
                className="bg-teal-600 hover:bg-teal-500"
              >
                <CgPoll className="w-4 h-4 mr-2" />
                Create Your First Poll
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50 ">
                  <TableHead>Poll Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead className="text-right font-grotesk">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPolls.map((poll) => {
                  const status = getPollStatus(poll);
                  return (
                    <TableRow key={poll.id} className="font-grotesk">
                      <TableCell>
                        <div className="flex flex-col gap-1 py-1">
                          <p className="font-medium text-neutral-800">
                            {poll.title}
                          </p>
                          {poll.description && (
                            <p className="text-sm text-neutral-500 line-clamp-1">
                              {poll.description}
                            </p>
                          )}
                          <p className="text-xs text-neutral-400">
                            {formatDate(poll.start_at)} -{" "}
                            {poll.end_at ? formatDate(poll.end_at) : "No end"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(status)}
                          <p className="text-xs text-neutral-500">
                            {getTimeInfo(poll)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <p className="font-medium text-neutral-800">
                            {poll.votes.toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {poll.options} options
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setSelectedPollId(poll.id)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Results
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyLink(poll.id)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setPollToShare(poll);
                                setShareDialogOpen(true);
                              }}
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setPollToDelete(poll);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* See More Button at bottom of table */}
          {!isLoading && recentPolls.length > 0 && polls.length > 5 && (
            <div className="border-t bg-neutral-50 px-6 py-3 flex items-center justify-center">
              <Button
                variant="outline"
                onClick={() => navigate("/polls")}
                className="font-grotesk"
              >
                See All {polls.length} Polls
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="font-grotesk">
          <DialogHeader>
            <DialogTitle>Delete Poll</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{pollToDelete?.title}"? This
              action cannot be undone and will permanently delete all votes and
              options.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPollToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePoll}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="font-grotesk">
          <DialogHeader>
            <DialogTitle>Share Poll</DialogTitle>
            <DialogDescription>
              Share "{pollToShare?.title}" on social media or copy the link.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleShare("twitter")}
              className="flex items-center gap-2"
            >
              <FaXTwitter className="w-4 h-4" />
              Twitter
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("facebook")}
              className="flex items-center gap-2"
            >
              <FaFacebook className="w-4 h-4" />
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("linkedin")}
              className="flex items-center gap-2"
            >
              <FaLinkedin className="w-4 h-4" />
              LinkedIn
            </Button>
            <Button
              variant="outline"
              onClick={() => handleShare("email")}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (pollToShare) handleCopyLink(pollToShare.id);
                setShareDialogOpen(false);
              }}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Poll Detail Modal */}
      <PollDetail
        pollId={selectedPollId}
        isOpen={!!selectedPollId}
        onClose={() => setSelectedPollId(null)}
      />
    </>
  );
}
