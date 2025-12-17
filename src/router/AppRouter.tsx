import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "@/pages/LandingPage";

// Auth pages (public)
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

import Callback from "@/pages/auth/Callback";

// Protected pages (require auth)
import Dashboard from "../pages/Dashboard";
import Polls from "@/pages/Polls";
import PublicPollVote from "@/pages/PublicPollVote";
import Settings from "@/pages/Settings";

import Layout from "@/components/Layout/Layout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<Callback />} />

        {/* Protected Routes - Require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/polls"
          element={
            <ProtectedRoute>
              <Layout>
                <Polls />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Public Vote View */}
        <Route path="/poll/:pollId" element={<PublicPollVote />} />
      </Routes>
    </BrowserRouter>
  );
}
