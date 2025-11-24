import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../api/supabaseClient";
import { getDeviceId } from "../../utils/device";

export const submitVote = createAsyncThunk(
  "votes/submit",
  async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
    const deviceId = getDeviceId();

    // Prevent multiple votes per device
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId)
      .eq("device_id", deviceId)
      .single();

    if (existingVote) throw new Error("You have already voted on this poll");

    const { error } = await supabase.from("poll_votes").insert([
      {
        poll_id: pollId,
        option_id: optionId,
        device_id: deviceId,
      },
    ]);

    if (error) throw error;
    return { pollId, optionId, deviceId };
  }
);

const votesSlice = createSlice({
  name: "votes",
  initialState: { voting: false, error: null as string | null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(submitVote.pending, (state) => {
        state.voting = true;
      })
      .addCase(submitVote.fulfilled, (state) => {
        state.voting = false;
      })
      .addCase(submitVote.rejected, (state, action) => {
        state.voting = false;
        state.error = action.error.message || "Failed to vote";
      });
  },
});

export default votesSlice.reducer;
