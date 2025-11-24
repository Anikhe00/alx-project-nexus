import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchPoll } from "../features/polls/pollsSlice";
import { submitVote } from "../features/votes/votesSlice";
import { logEvent } from "../features/analytics/analyticsSlice";
import type { RootState, AppDispatch } from "../app/store";
import type { PollOption } from "../features/polls/pollsTypes";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PollPage = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedPoll: poll, loading } = useSelector(
    (state: RootState) => state.polls
  );
  const { voting, error } = useSelector((state: RootState) => state.votes);

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) dispatch(fetchPoll(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (poll) {
      // initialize vote counts
      const counts: Record<string, number> = {};
      poll.poll_options?.forEach(
        (opt: PollOption) => (counts[opt.id] = opt.votes || 0)
      );
      setVoteCounts(counts);

      // log view
      dispatch(logEvent({ pollId: poll.id, eventType: "poll_view" }));
    }
  }, [poll, dispatch]);

  const handleVote = async (optionId: string) => {
    if (!poll) return;
    try {
      await dispatch(submitVote({ pollId: poll.id, optionId })).unwrap();
      setVoteCounts((prev) => ({
        ...prev,
        [optionId]: (prev[optionId] || 0) + 1,
      }));
      dispatch(logEvent({ pollId: poll.id, optionId, eventType: "poll_vote" }));
    } catch (err) {
      console.error(err);
      alert((err as Error).message);
    }
  };

  if (loading || !poll) return <p>Loading poll...</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{poll.title}</h1>
      {poll.description && (
        <p className="text-gray-600 mb-6">{poll.description}</p>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6">
        {poll.poll_options?.map((opt: PollOption) => (
          <button
            key={opt.id}
            className="p-4 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => handleVote(opt.id)}
            disabled={voting}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-2">Live Results</h2>
      <Bar
        data={{
          labels: poll.poll_options?.map((o) => o.label),
          datasets: [
            {
              label: "# of Votes",
              data: poll.poll_options?.map((o) => voteCounts[o.id] || 0),
              backgroundColor: "#2563EB",
            },
          ],
        }}
        options={{ responsive: true, plugins: { legend: { display: false } } }}
      />
    </div>
  );
};

export default PollPage;
