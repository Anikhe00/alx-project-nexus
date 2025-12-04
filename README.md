# PollUp - Interactive Online Polling Platform

<div align="center">
  <img src="/public/logo.png" alt="PollUp Logo" width="200"/>
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646cff.svg)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e.svg)](https://supabase.com/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
</div>

## 📋 Overview

PollUp is a modern, real-time online polling platform that enables users to create, share, and vote on polls with instant result updates. Built as part of the ProDev FE case study, this application demonstrates advanced front-end development skills including real-time data synchronization, state management with Context API, and dynamic data visualization.

**Live Demo:** [https://pollup.vercel.app](https://pollup.vercel.app)

## ✨ Key Features

### 🎯 Core Functionality

- **User Authentication**: Secure signup/login with email verification
- **Poll Creation**: Multi-step form with validation (title, options, scheduling)
- **Real-Time Voting**: Live vote counting with device-based duplicate prevention
- **Dynamic Results**: Interactive charts and progress bars showing live poll results
- **Poll Management**: View, edit, share, and delete polls from a centralized dashboard

### 📊 Analytics & Insights

- **Comprehensive Analytics**: Track views, votes, conversion rates
- **Device Distribution**: Monitor voter engagement across desktop, mobile, and tablet
- **Time-Based Insights**: Daily activity and hourly voting patterns
- **Visual Representations**: Charts and graphs for easy data interpretation

### 🎨 User Experience

- **Responsive Design**: Seamless experience across all devices
- **Dark Mode Ready**: Theme support for better accessibility
- **Intuitive UI**: Clean, modern interface with smooth animations
- **Status Management**: Active, upcoming, and past poll categorization

### 🔗 Social Features

- **Multi-Platform Sharing**: Share polls via Twitter, Facebook, LinkedIn, and Email
- **Copy Link**: Quick link copying for easy poll distribution
- **Unique Poll URLs**: Each poll has a shareable public URL

## 🛠️ Technologies Used

### Frontend Stack

- **React 18.3** - Component-based UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Shadcn/ui** - Accessible component library

### State Management

- **React Context API** - Global state management
- **React Hook Form** - Form handling with validation
- **Zod** - Schema validation

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication

### Data Visualization

- **Recharts** - Chart library for analytics
- **TanStack Table** - Powerful table management
- **Custom Progress Bars** - Real-time result visualization

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control
- **Vercel** - Deployment platform

## 📁 Project Structure

```
pollup/
├── src/
│   ├── api/
│   │   └── supabaseClient.ts          # Supabase configuration
│   ├── components/
│   │   ├── ui/                         # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   ├── AppSidebar.tsx              # Application sidebar
│   │   ├── Header.tsx                  # Navigation header
│   │   ├── CreatePollForm.tsx          # Poll creation modal
│   │   ├── PollDetails.tsx             # Poll detail view
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.tsx             # Authentication state
│   │   └── PollsContext.tsx            # Polls state management
│   ├── lib/
│   │   ├── analytics.ts                # Analytics tracking utilities
│   │   ├── utils.ts                    # Helper functions
│   │   └── validations/
│   │       └── auth.ts                 # Authentication schemas
│   ├── pages/
│   │   ├── Dashboard.tsx               # Dashboard overview
│   │   ├── Polls.tsx                   # Polls management page
│   │   ├── Login.tsx                   # Login page
│   │   ├── Register.tsx                # Registration page
│   │   └── ...
│   ├── App.tsx                         # App entry point
│   └── main.tsx                        # React DOM root
├── public/
├── .env.example                        # Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/pollup.git
cd pollup
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Set up Supabase database**

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NULL,
  start_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  end_at TIMESTAMP WITHOUT TIME ZONE NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT polls_pkey PRIMARY KEY (id),
  CONSTRAINT polls_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id)
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  poll_id UUID NOT NULL,
  label TEXT NOT NULL,
  image_url TEXT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT poll_options_pkey PRIMARY KEY (id),
  CONSTRAINT poll_options_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  poll_id UUID NOT NULL,
  option_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  user_id UUID NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT poll_votes_pkey PRIMARY KEY (id),
  CONSTRAINT poll_votes_option_id_fkey FOREIGN KEY (option_id) REFERENCES poll_options (id) ON DELETE CASCADE,
  CONSTRAINT poll_votes_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES polls (id) ON DELETE CASCADE,
  CONSTRAINT poll_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id)
);

-- Create unique index for one vote per device per poll
CREATE UNIQUE INDEX unique_device_vote_per_poll ON public.poll_votes USING btree (poll_id, device_id);

-- Create analytics table
CREATE TABLE public.analytics (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  event_type TEXT NOT NULL,
  poll_id UUID NULL,
  option_id UUID NULL,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT analytics_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_option_id_fkey FOREIGN KEY (option_id) REFERENCES poll_options (id),
  CONSTRAINT analytics_poll_id_fkey FOREIGN KEY (poll_id) REFERENCES polls (id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Polls policies
CREATE POLICY "Users can view all polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Users can create their own polls" ON public.polls FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own polls" ON public.polls FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own polls" ON public.polls FOR DELETE USING (auth.uid() = created_by);

-- Poll options policies
CREATE POLICY "Anyone can view poll options" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Poll creators can insert options" ON public.poll_options FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = poll_options.poll_id AND polls.created_by = auth.uid())
);

-- Poll votes policies
CREATE POLICY "Anyone can view votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON public.poll_votes FOR INSERT WITH CHECK (true);

-- Analytics policies
CREATE POLICY "Anyone can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Poll creators can view their poll analytics" ON public.analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM polls WHERE polls.id = analytics.poll_id AND polls.created_by = auth.uid())
);

-- Create trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

5. **Configure email redirect URL in Supabase**

Go to Authentication > URL Configuration in your Supabase dashboard and add:

```
Site URL: https://your-deployed-app.vercel.app
Redirect URLs:
  - https://your-deployed-app.vercel.app/auth/callback
  - http://localhost:5173/auth/callback (for development)
```

6. **Start the development server**

```bash
npm run dev
```

Visit `http://localhost:5173` to see the app running.

## 📦 Building for Production

```bash
npm run build
npm run preview  # Preview production build locally
```

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

```bash
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## 🎯 Usage Guide

### Creating a Poll

1. Click "Create Poll" button
2. Fill in poll details:
   - **Step 1**: Title and description
   - **Step 2**: Add 2-10 options
   - **Step 3**: Set start/end dates (optional)
3. Click "Create Poll"
4. Share the poll link with your audience

### Managing Polls

- **View Results**: Click on any poll to see live results
- **Share**: Use the share button to distribute via social media
- **Analytics**: Switch to Analytics tab to view detailed insights
- **Delete**: Remove polls you no longer need

### Voting on Polls

1. Open a poll link
2. Select your preferred option
3. Click "Submit Vote"
4. View updated results instantly

## 🔐 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Device-based voting**: Prevents duplicate votes per device
- **Secure authentication**: Email verification required
- **Environment variables**: Sensitive data protected
- **Input validation**: All forms validated with Zod schemas

## 📈 Performance Optimizations

- **Code splitting**: Dynamic imports for better load times
- **Lazy loading**: Components loaded on demand
- **Memoization**: Context values and computed data cached
- **Debounced search**: Optimized search functionality
- **Optimistic updates**: Immediate UI feedback

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding/updating tests
- `chore:` Maintenance tasks

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**

- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourprofile)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

## 🙏 Acknowledgments

- Built as part of the ProDev FE case study
- Design inspiration from modern polling platforms
- Icons by [Lucide](https://lucide.dev/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)

## 📞 Support

For support, email your.email@example.com or open an issue in the repository.

---

<div align="center">
  Made with ❤️ using React, TypeScript, and Supabase
</div>
