export interface Poll {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  poll_options?: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  created_at: string;
  votes?: number; // computed from votes table
}
