import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../api/supabaseClient";
import { getDeviceId } from "../../utils/device";

// Track view or vote
export const logEvent = createAsyncThunk(
  "analytics/logEvent",
  async ({
    pollId,
    optionId,
    eventType,
  }: {
    pollId: string;
    optionId?: string;
    eventType: "poll_view" | "poll_vote";
  }) => {
    const deviceId = getDeviceId();

    const { error } = await supabase.from("analytics_events").insert([
      {
        poll_id: pollId,
        option_id: optionId,
        device_id: deviceId,
        event_type: eventType,
      },
    ]);

    if (error) throw error;
    return { pollId, optionId, eventType };
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: { logging: false, error: null as string | null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logEvent.pending, (state) => {
        state.logging = true;
      })
      .addCase(logEvent.fulfilled, (state) => {
        state.logging = false;
      })
      .addCase(logEvent.rejected, (state, action) => {
        state.logging = false;
        state.error = action.error.message || "Failed to log event";
      });
  },
});

export default analyticsSlice.reducer;
