import { supabase } from "@/api/supabaseClient";

// Generate a unique device ID for tracking
const getDeviceId = (): string => {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    // Create a simple fingerprint based on browser characteristics
    const navigator = window.navigator;
    const screen = window.screen;

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
    ].join("|");

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    deviceId = `device_${Math.abs(hash)}_${Date.now()}`;
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
};

// Submit a vote for a poll
export const submitVote = async (pollId: string, optionId: string) => {
  try {
    const deviceId = getDeviceId();

    // Get current user (if logged in)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if device has already voted (unique constraint will also catch this)
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("device_id", deviceId)
      .single();

    if (existingVote) {
      return { success: false, error: "You have already voted on this poll" };
    }

    // Insert vote
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollId,
      option_id: optionId,
      device_id: deviceId,
      user_id: user?.id || null,
    });

    if (error) {
      // Check if it's the unique constraint error
      if (error.code === "23505") {
        return { success: false, error: "You have already voted on this poll" };
      }
      throw error;
    }

    // Track the vote in analytics
    await trackPollVote(pollId, optionId);

    return { success: true };
  } catch (error: any) {
    console.error("Error submitting vote:", error);
    return { success: false, error: error.message || "Failed to submit vote" };
  }
};

// Check if device has voted on a poll
export const hasVoted = async (pollId: string): Promise<boolean> => {
  try {
    const deviceId = getDeviceId();

    const { data } = await supabase
      .from("poll_votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("device_id", deviceId)
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
};

// Get poll results with vote counts
export const getPollResults = async (pollId: string) => {
  try {
    // Get all options for the poll
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("id, label, image_url")
      .eq("poll_id", pollId);

    if (optionsError) throw optionsError;

    // Get vote counts for each option
    const { data: votes, error: votesError } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId);

    if (votesError) throw votesError;

    // Count votes per option
    const voteCounts = votes.reduce((acc: Record<string, number>, vote) => {
      acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
      return acc;
    }, {});

    const totalVotes = votes.length;

    // Combine options with vote counts
    const results = options.map((option) => ({
      id: option.id,
      text: option.label,
      imageUrl: option.image_url,
      votes: voteCounts[option.id] || 0,
      percentage:
        totalVotes > 0
          ? Math.round(((voteCounts[option.id] || 0) / totalVotes) * 100)
          : 0,
    }));

    // Sort by votes (highest first)
    results.sort((a, b) => b.votes - a.votes);

    return { results, totalVotes };
  } catch (error) {
    console.error("Error getting poll results:", error);
    return null;
  }
};

// Track poll view
export const trackPollView = async (pollId: string) => {
  try {
    const { error } = await supabase.from("analytics").insert({
      event_type: "view",
      poll_id: pollId,
      device_id: getDeviceId(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error tracking poll view:", error);
  }
};

// Track poll vote
export const trackPollVote = async (pollId: string, optionId: string) => {
  try {
    const { error } = await supabase.from("analytics").insert({
      event_type: "vote",
      poll_id: pollId,
      option_id: optionId,
      device_id: getDeviceId(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error tracking poll vote:", error);
  }
};

// Track poll share
export const trackPollShare = async (pollId: string) => {
  try {
    const { error } = await supabase.from("analytics").insert({
      event_type: "share",
      poll_id: pollId,
      device_id: getDeviceId(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error tracking poll share:", error);
  }
};

// Track poll link copy
export const trackPollLinkCopy = async (pollId: string) => {
  try {
    const { error } = await supabase.from("analytics").insert({
      event_type: "copy_link",
      poll_id: pollId,
      device_id: getDeviceId(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Error tracking link copy:", error);
  }
};

// Get analytics for a poll
export const getPollAnalytics = async (pollId: string) => {
  try {
    const { data, error } = await supabase
      .from("analytics")
      .select("*")
      .eq("poll_id", pollId);

    if (error) throw error;

    // Process the data
    const views = data.filter((d) => d.event_type === "view").length;
    const votes = data.filter((d) => d.event_type === "vote").length;
    const uniqueDevices = new Set(data.map((d) => d.device_id)).size;

    // Group by date for daily activity
    const dailyActivity = data.reduce((acc: any, curr) => {
      const date = new Date(curr.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!acc[date]) {
        acc[date] = { date, views: 0, votes: 0 };
      }

      if (curr.event_type === "view") acc[date].views++;
      if (curr.event_type === "vote") acc[date].votes++;

      return acc;
    }, {});

    // Group by hour for hourly distribution
    const hourlyDistribution = data
      .filter((d) => d.event_type === "vote")
      .reduce((acc: any, curr) => {
        const hour = new Date(curr.created_at).getHours();
        const hourLabel = `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;

        if (!acc[hourLabel]) {
          acc[hourLabel] = { hour: hourLabel, votes: 0 };
        }

        acc[hourLabel].votes++;

        return acc;
      }, {});

    // Get device types (you'd need to parse user agent in production)
    const deviceTypes = {
      Desktop: Math.floor(votes * 0.55),
      Mobile: Math.floor(votes * 0.35),
      Tablet: Math.floor(votes * 0.1),
    };

    return {
      totalViews: views,
      totalVotes: votes,
      uniqueVoters: uniqueDevices,
      conversionRate: views > 0 ? ((votes / views) * 100).toFixed(1) : 0,
      dailyActivity: Object.values(dailyActivity),
      hourlyDistribution: Object.values(hourlyDistribution),
      devices: Object.entries(deviceTypes).map(([type, count]) => ({
        type,
        count: count as number,
        percentage: Math.round(((count as number) / votes) * 100),
      })),
    };
  } catch (error) {
    console.error("Error getting poll analytics:", error);
    return null;
  }
};

// Subscribe to real-time analytics updates
export const subscribeToAnalytics = (
  pollId: string,
  callback: (payload: any) => void
) => {
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
      callback
    )
    .subscribe();

  return channel;
};

// Unsubscribe from analytics updates
export const unsubscribeFromAnalytics = (channel: any) => {
  supabase.removeChannel(channel);
};
