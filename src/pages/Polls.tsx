import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CgPoll } from "react-icons/cg";

import {
  Search,
  MoreVertical,
  Copy,
  Eye,
  Trash2,
  Clock,
  ArrowUpDown,
  Share2,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

import PollDetail from "@/components/ui/PollDetails";
import CreatePollModal from "@/components/ui/CreatePollForm";

import { supabase } from "@/api/supabaseClient";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "sonner";
import { FaFacebook, FaLinkedin, FaXTwitter } from "react-icons/fa6";

import { useLocation } from "react-router-dom";

export type Poll = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  created_at: string;
  votes: number;
  options: number;
};

type FilterTab = "all" | "active" | "upcoming" | "past";

// Helper functions
const getPollStatus = (poll: Poll): FilterTab => {
  const now = new Date();
  const startDate = new Date(poll.start_at);
  const endDate = new Date(poll.end_at);

  if (now < startDate) return "upcoming";
  if (now > endDate) return "past";
  return "active";
};

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

const getTimeInfo = (poll: Poll) => {
  const now = new Date();
  const startDate = new Date(poll.start_at);
  const endDate = new Date(poll.end_at);
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

const Polls = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [pollToShare, setPollToShare] = useState<Poll | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("openForm") === "true") {
      setIsCreateModalOpen(true);
    }
  }, [location.search]);

  // Fetch polls from supabase
  const fetchPolls = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
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

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // Handle delete poll
  const handleDeletePoll = async () => {
    if (!pollToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("polls")
        .delete()
        .eq("id", pollToDelete.id);

      if (error) throw error;

      toast.success("Poll deleted successfully");
      fetchPolls();
      setDeleteDialogOpen(false);
      setPollToDelete(null);
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    } finally {
      setIsDeleting(false);
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

  // Memoize filtered data to prevent recalculation on every render
  const filteredData = useMemo(() => {
    return polls.filter((poll) => {
      const matchesTab =
        activeTab === "all" || getPollStatus(poll) === activeTab;
      const matchesSearch = poll.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchQuery, polls]);

  // Memoize columns to prevent recreation on every render
  const columns = useMemo<ColumnDef<Poll>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hover:bg-transparent p-0 font-medium text-neutral-700"
            >
              Poll Details
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const poll = row.original;
          return (
            <div className="flex flex-col gap-1 py-2">
              <p className="font-medium text-neutral-800">{poll.title}</p>
              {poll.description && (
                <p className="text-sm text-neutral-500 line-clamp-1">
                  {poll.description}
                </p>
              )}
              <p className="text-xs text-neutral-400">
                {formatDate(poll.start_at)} - {formatDate(poll.end_at)}
              </p>
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const poll = row.original;
          const status = getPollStatus(poll);
          return (
            <div className="flex flex-col gap-1">
              {getStatusBadge(status)}
              <p className="text-xs text-neutral-500">{getTimeInfo(poll)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "votes",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hover:bg-transparent p-0 font-medium text-neutral-700"
            >
              Votes
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const poll = row.original;
          return (
            <div className="flex flex-col gap-0.5">
              <p className="font-medium text-neutral-800">
                {poll.votes.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-500">{poll.options} options</p>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const poll = row.original;

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedPollId(poll.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyLink(poll.id)}>
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
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const tabCounts = useMemo(
    () => ({
      all: polls.length,
      active: polls.filter((p) => getPollStatus(p) === "active").length,
      upcoming: polls.filter((p) => getPollStatus(p) === "upcoming").length,
      past: polls.filter((p) => getPollStatus(p) === "past").length,
    }),
    [polls]
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold font-grotesk text-neutral-800">
              My Polls
            </h1>
            <p className="text-sm text-neutral-500">
              Manage and track all your polls
            </p>
          </div>
          <Button
            className="bg-teal-600 hover:bg-teal-500 text-white cursor-pointer"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <CgPoll className="w-4 h-4 text-white" />
            Create Poll
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-neutral-200">
          {(["all", "active", "upcoming", "past"] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium capitalize transition-colors relative cursor-pointer font-grotesk",
                activeTab === tab
                  ? "text-teal-600 border-b-2 border-teal-600"
                  : "text-neutral-600 hover:text-neutral-800"
              )}
            >
              {tab}
              <span
                className={cn(
                  "ml-2 px-2 py-0.5 text-xs rounded-full",
                  activeTab === tab
                    ? "bg-teal-100 text-teal-700"
                    : "bg-neutral-100 text-neutral-600"
                )}
              >
                {tabCounts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-md text-sm font-grotesk"
          />
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-neutral-50 hover:bg-neutral-50 font-grotesk"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center font-grotesk text-neutral-500"
                  >
                    No polls found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden grid gap-4">
          {filteredData.length === 0 ? (
            <div className="text-center font-grotesk py-12 text-neutral-500 border rounded-lg">
              No polls found
            </div>
          ) : (
            filteredData.map((poll) => (
              <div
                key={poll.id}
                className="border rounded-lg p-4 font-grotesk hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-neutral-800 mb-1">
                      {poll.title}
                    </h3>
                    {poll.description && (
                      <p className="text-sm text-neutral-500 line-clamp-2 mb-2">
                        {poll.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer shrink-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="font-grotesk">
                      <DropdownMenuItem
                        onClick={() => setSelectedPollId(poll.id)}
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Results
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => handleCopyLink(poll.id)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setPollToShare(poll);
                          setShareDialogOpen(true);
                        }}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 cursor-pointer"
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
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(getPollStatus(poll))}
                  </div>
                  <div className="text-neutral-500">
                    {poll.votes.toLocaleString()} votes
                  </div>
                  <div className="text-neutral-500">{poll.options} options</div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-neutral-400 flex items-center justify-between">
                  <span>{getTimeInfo(poll)}</span>
                  <span>
                    {formatDate(poll.start_at)} - {formatDate(poll.end_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {table.getRowModel().rows.length > 0 && (
          <div className="flex items-center justify-between font-grotesk">
            <div className="text-sm text-neutral-500">
              Showing {table.getRowModel().rows.length} of {filteredData.length}{" "}
              polls
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchPolls}
      />

      {/* Poll Detail Modal */}
      <PollDetail
        pollId={selectedPollId}
        isOpen={!!selectedPollId}
        onClose={() => setSelectedPollId(null)}
      />
    </>
  );
};

export default Polls;
