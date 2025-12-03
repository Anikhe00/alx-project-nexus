import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import LandingPage from "@/pages/LandingPage";
import Register from "../pages/auth/Register";
import Login from "../pages/auth/Login";
import Callback from "@/pages/auth/Callback";
import Dashboard from "../pages/Dashboard";
import Polls from "@/pages/Polls";
import PublicPollVote from "@/pages/PublicPollVote";

import Layout from "@/components/Layout/Layout";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<Callback />} />

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

        <Route path="/poll/:pollId" element={<PublicPollVote />} />
      </Routes>
    </BrowserRouter>
  );
}
