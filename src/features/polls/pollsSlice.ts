import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../api/supabaseClient";
import type { Poll, PollOption } from "./pollsTypes";

// Fetch all polls
export const fetchPolls = createAsyncThunk("polls/fetchAll", async () => {
  const { data, error } = await supabase
    .from("polls")
    .select(`*, poll_options(*)`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Poll[];
});

// Fetch single poll
export const fetchPoll = createAsyncThunk(
  "polls/fetchOne",
  async (id: string) => {
    const { data, error } = await supabase
      .from("polls")
      .select(`*, poll_options(*)`)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Poll;
  }
);

// Create poll (admin)
export const createPoll = createAsyncThunk(
  "polls/create",
  async ({
    title,
    description,
    options,
  }: {
    title: string;
    description?: string;
    options: string[];
  }) => {
    const { data: poll, error } = await supabase
      .from("polls")
      .insert([{ title, description }])
      .select()
      .single();

    if (error) throw error;

    const optionData = options.map((label) => ({ poll_id: poll.id, label }));
    const { error: optionError } = await supabase
      .from("poll_options")
      .insert(optionData);
    if (optionError) throw optionError;

    return { ...poll, options };
  }
);

const pollsSlice = createSlice({
  name: "polls",
  initialState: {
    polls: [] as Poll[],
    selectedPoll: null as Poll | null,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolls.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPolls.fulfilled, (state, action) => {
        state.loading = false;
        state.polls = action.payload;
      })
      .addCase(fetchPolls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch polls";
      })
      .addCase(fetchPoll.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPoll.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedPoll = action.payload;
      })
      .addCase(fetchPoll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch poll";
      });
  },
});

export default pollsSlice.reducer;
