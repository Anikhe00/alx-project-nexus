import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/api/supabaseClient";
import StatCard from "./statCard";
import {
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Label,
  Bar,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  MousePointer,
  Smartphone,
  Monitor,
  Laptop,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import type { ChartConfig } from "@/components/ui/chart";

interface PollAnalyticsProps {
  pollId: string;
  totalVotes: number;
  viewCount: number;
}

// 1. Define Chart Configurations
const votesChartConfig = {
  votes: {
    label: "Votes",
    color: "#0d9488",
  },
} satisfies ChartConfig;

const deviceChartConfig = {
  votes: {
    label: "Votes",
  },
  Desktop: {
    label: "Desktop",
    color: "#0d9488",
    icon: Monitor,
  },
  Mobile: {
    label: "Mobile",
    color: "#2dd4bf",
    icon: Smartphone,
  },
  Tablet: {
    label: "Tablet",
    color: "#5eead4",
    icon: Laptop,
  },
  Other: {
    label: "Other",
    color: "#99f6e4",
    icon: Globe,
  },
} satisfies ChartConfig;

export default function PollAnalytics({
  pollId,
  totalVotes,
  viewCount,
}: PollAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [votesData, setVotesData] = useState<any[]>([]);

  // Fetch raw vote data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("poll_votes")
        .select("created_at, device_type")
        .eq("poll_id", pollId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setVotesData(data);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [pollId]);

  // 1. Process Timeline Data
  const timelineData = useMemo(() => {
    const map = new Map();
    votesData.forEach((vote) => {
      const date = new Date(vote.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      map.set(date, (map.get(date) || 0) + 1);
    });

    return Array.from(map.entries()).map(([date, votes]) => ({
      date,
      votes,
    }));
  }, [votesData]);

  // 2. Process Device Data
  const deviceData = useMemo(() => {
    const counts: Record<string, number> = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0,
      Other: 0,
    };

    votesData.forEach((v) => {
      const type = v.device_type || "Other";
      if (counts[type] !== undefined) {
        counts[type]++;
      } else {
        counts["Other"]++;
      }
    });

    // Map to array expected by Recharts
    return Object.entries(counts)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => {
        const config = deviceChartConfig[key as keyof typeof deviceChartConfig];
        return {
          device: key,
          votes: value,
          fill: (config as any)?.color || "#99f6e4",
        };
      });
  }, [votesData]);

  // 3. Calculate Conversion Rate
  const conversionRate =
    viewCount > 0 ? ((totalVotes / viewCount) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p>Crunching numbers...</p>
      </div>
    );
  }

  if (votesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
        <p>No votes recorded yet.</p>
        <p className="text-sm">Share your poll to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-grotesk gap-5 max-w-4xl mx-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Views"
          data={viewCount.toLocaleString()}
          icon={MousePointer}
          iconColor="text-teal-600"
        />

        <StatCard
          title="Conversion"
          data={conversionRate + "%"}
          icon={TrendingUp}
          iconColor="text-green-600"
        />

        <StatCard
          className="col-span-2 md:col-span-1"
          title="Top Device"
          data={
            deviceData.sort((a, b) => b.votes - a.votes)[0]?.device || "N/A"
          }
          icon={Smartphone}
          iconColor="text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Vote Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={votesChartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <BarChart
                accessibilityLayer
                data={timelineData}
                margin={{
                  left: 12,
                  right: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="votes"
                  type="natural"
                  fill="var(--color-votes)"
                  fillOpacity={0.4}
                  stroke="var(--color-votes)"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Device Donut Chart */}
        <Card className="flex flex-col shadow-none">
          <CardHeader className="items-center pb-0">
            <CardTitle>Device Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={deviceChartConfig}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={deviceData}
                  dataKey="votes"
                  nameKey="device"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalVotes.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground text-xs"
                            >
                              Votes
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
