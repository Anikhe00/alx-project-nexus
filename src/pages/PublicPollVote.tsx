import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";

type Poll = {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string;
  created_at: string;
};

type PollOption = {
  id: string;
  label: string;
  image_url: string | null;
  votes: number;
};

// Generate device fingerprint
const getDeviceId = () => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

const PublicPollVote = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  // Check poll status
  const getPollStatus = () => {
    if (!poll) return "loading";
    const now = new Date();
    const startDate = new Date(poll.start_at);
    const endDate = new Date(poll.end_at);

    if (now < startDate) return "upcoming";
    if (now > endDate) return "ended";
    return "active";
  };

  const status = getPollStatus();
  const showResults = hasVoted || status === "ended";

  // Fetch poll and check if user has voted
  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;

      try {
        // Fetch poll details
        const { data: pollData, error: pollError } = await supabase
          .from("polls")
          .select("*")
          .eq("id", pollId)
          .single();

        if (pollError) throw pollError;
        setPoll(pollData);

        // Fetch poll options with vote counts
        const { data: optionsData, error: optionsError } = await supabase
          .from("poll_options")
          .select("*")
          .eq("poll_id", pollId);

        if (optionsError) throw optionsError;

        // Get vote counts for each option
        const optionsWithVotes = await Promise.all(
          optionsData.map(async (option) => {
            const { count } = await supabase
              .from("poll_votes")
              .select("*", { count: "exact", head: true })
              .eq("option_id", option.id);

            return {
              id: option.id,
              label: option.label,
              image_url: option.image_url,
              votes: count || 0,
            };
          })
        );

        // Sort by votes (highest first)
        optionsWithVotes.sort((a, b) => b.votes - a.votes);
        setOptions(optionsWithVotes);

        // Calculate total votes
        const total = optionsWithVotes.reduce((sum, opt) => sum + opt.votes, 0);
        setTotalVotes(total);

        // Check if device has already voted
        const deviceId = getDeviceId();
        const { data: voteData } = await supabase
          .from("poll_votes")
          .select("option_id")
          .eq("poll_id", pollId)
          .eq("device_id", deviceId)
          .single();

        if (voteData) {
          setHasVoted(true);
          setSelectedOption(voteData.option_id);
        }
      } catch (error) {
        console.error("Error fetching poll:", error);
        toast.error("Failed to load poll");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  // Submit vote
  const handleVote = async () => {
    if (!selectedOption || !pollId) return;

    setIsSubmitting(true);
    try {
      const deviceId = getDeviceId();

      // Insert vote
      const { error } = await supabase.from("poll_votes").insert({
        poll_id: pollId,
        option_id: selectedOption,
        device_id: deviceId,
        user_id: null, // Anonymous vote
      });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast.error("You have already voted on this poll");
          setHasVoted(true);
          return;
        }
        throw error;
      }

      toast.success("Vote submitted successfully!");
      setHasVoted(true);

      // Refresh results
      const { data: optionsData } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", pollId);

      if (optionsData) {
        const optionsWithVotes = await Promise.all(
          optionsData.map(async (option) => {
            const { count } = await supabase
              .from("poll_votes")
              .select("id", { count: "exact" })
              .eq("option_id", option.id);

            return {
              id: option.id,
              label: option.label,
              image_url: option.image_url,
              votes: count || 0,
            };
          })
        );

        optionsWithVotes.sort((a, b) => b.votes - a.votes);
        setOptions(optionsWithVotes);

        const total = optionsWithVotes.reduce((sum, opt) => sum + opt.votes, 0);
        setTotalVotes(total);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Failed to submit vote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeRemaining = () => {
    if (!poll) return "";
    const now = new Date();
    const endDate = new Date(poll.end_at);
    const diff = endDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return "Poll has ended";
    if (days === 0) return "Ends today";
    return `${days} day${days !== 1 ? "s" : ""} remaining`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600 font-grotesk">Loading poll...</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold font-grotesk mb-2">
              Poll Not Found
            </h2>
            <p className="text-neutral-600 mb-4">
              This poll doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="font-grotesk"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            {/* Poll Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl font-bold font-grotesk text-neutral-800">
                  {poll.title}
                </h1>
                {status === "active" && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                {status === "upcoming" && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Upcoming
                  </Badge>
                )}
                {status === "ended" && (
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                    <Clock className="w-3 h-3 mr-1" />
                    Ended
                  </Badge>
                )}
              </div>

              {poll.description && (
                <p className="text-neutral-600 mb-4">{poll.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
                <span>Starts: {formatDate(poll.start_at)}</span>
                <span>•</span>
                <span>Ends: {formatDate(poll.end_at)}</span>
                <span>•</span>
                <span className="font-medium">{getTimeRemaining()}</span>
              </div>
            </div>

            {/* Status Messages */}
            {status === "upcoming" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  This poll hasn't started yet. Come back on{" "}
                  {formatDate(poll.start_at)} to vote!
                </p>
              </div>
            )}

            {status === "ended" && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-gray-800 font-medium">
                  This poll has ended. Here are the final results:
                </p>
              </div>
            )}

            {hasVoted && status === "active" && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-teal-800 font-medium">
                    Thank you for voting!
                  </p>
                  <p className="text-teal-700 text-sm mt-1">
                    You can view the current results below.
                  </p>
                </div>
              </div>
            )}

            {/* Poll Options */}
            <div className="space-y-3">
              {options.map((option, index) => {
                const percentage =
                  totalVotes > 0
                    ? Math.round((option.votes / totalVotes) * 100)
                    : 0;
                const isSelected = selectedOption === option.id;

                return (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (!hasVoted && status === "active") {
                        setSelectedOption(option.id);
                      }
                    }}
                    className={cn(
                      "relative border-2 rounded-lg p-4 transition-all cursor-pointer",
                      showResults && "cursor-default",
                      !showResults &&
                        status === "active" &&
                        "hover:border-teal-300 hover:bg-teal-50/50",
                      isSelected &&
                        !showResults &&
                        "border-teal-500 bg-teal-50",
                      !isSelected && !showResults && "border-neutral-200",
                      showResults && "border-neutral-200"
                    )}
                  >
                    {/* Rank Badge for Results */}
                    {showResults && index < 3 && (
                      <div
                        className={cn(
                          "absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
                          index === 0 && "bg-yellow-500",
                          index === 1 && "bg-gray-400",
                          index === 2 && "bg-orange-600"
                        )}
                      >
                        {index + 1}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-800 font-grotesk">
                        {option.label}
                      </span>
                      {showResults && (
                        <span className="text-sm font-semibold text-neutral-600">
                          {percentage}%
                        </span>
                      )}
                    </div>

                    {showResults && (
                      <>
                        <Progress value={percentage} className="h-2 mb-2" />
                        <p className="text-xs text-neutral-500">
                          {option.votes} vote{option.votes !== 1 ? "s" : ""}
                        </p>
                      </>
                    )}

                    {isSelected && !showResults && (
                      <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-teal-600" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vote Button */}
            {!hasVoted && status === "active" && (
              <div className="mt-6 flex flex-col gap-2">
                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || isSubmitting}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white font-grotesk"
                  size="lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit Vote"}
                </Button>
                <p className="text-xs text-center text-neutral-500">
                  Your vote is anonymous and cannot be changed once submitted
                </p>
              </div>
            )}

            {/* Total Votes */}
            {showResults && (
              <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
                <p className="text-sm text-neutral-600 font-grotesk">
                  <span className="font-semibold text-neutral-800">
                    {totalVotes.toLocaleString()}
                  </span>{" "}
                  total vote{totalVotes !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>
            Powered by{" "}
            <span className="font-semibold text-teal-600">PollApp</span>
          </p>
          <p className="mt-1">
            Want to create your own poll?{" "}
            <a href="/" className="text-teal-600 hover:underline">
              Sign up for free
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PublicPollVote;
