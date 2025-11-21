import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PollPage from "./pages/PollPage";
import CreatePoll from "./pages/CreatePoll";
import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/poll/:id" element={<PollPage />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
