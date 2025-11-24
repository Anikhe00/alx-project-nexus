import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "../../api/supabaseClient";

export const adminSignIn = createAsyncThunk(
  "auth/adminSignIn",
  async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  }
);

export const adminSignOut = createAsyncThunk("auth/adminSignOut", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    session: null as any,
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(adminSignIn.pending, (state) => {
        state.loading = true;
      })
      .addCase(adminSignIn.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
      })
      .addCase(adminSignIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Sign in failed";
      })
      .addCase(adminSignOut.fulfilled, (state) => {
        state.session = null;
      });
  },
});

export default authSlice.reducer;
