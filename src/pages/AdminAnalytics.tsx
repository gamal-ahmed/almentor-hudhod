
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, BarChart4, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import SessionAnalyticsTable from "@/components/admin/SessionAnalyticsTable";
import ModelUsageChart from "@/components/admin/ModelUsageChart";
import AcceptedModelsChart from "@/components/admin/AcceptedModelsChart";
import TranscriptionTimeChart from "@/components/admin/TranscriptionTimeChart";

// Define color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Define model statistics type
interface ModelStat {
  name: string;
  total: number;
  completed: number;
  failed: number;
  accepted: number;
  successRate: string;
  acceptanceRate: string;
}

export default function AdminAnalytics() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is an admin, redirect if not
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/signin");
    } else if (!loading && isAuthenticated && !isAdmin) {
      navigate("/app");
    } else if (!loading && isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, loading, isAdmin, navigate]);

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/app")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Transcription Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard 
          title="Total Sessions" 
          value={<TotalSessionsValue />} 
          icon={<BarChart4 className="h-4 w-4" />} 
        />
        <StatsCard 
          title="Models Accepted" 
          value={<AcceptedModelsValue />} 
          icon={<CheckCircle2 className="h-4 w-4" />} 
        />
        <StatsCard 
          title="Minutes Transcribed" 
          value={<TranscriptionMinutesValue />} 
          icon={<Clock className="h-4 w-4" />} 
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Model Usage</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Model Usage</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ModelUsageChart />
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Accepted Models</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <AcceptedModelsChart />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Transcription Time (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <TranscriptionTimeChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ModelDetailedAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <SessionAnalyticsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

// Stats Value Components with data fetching
function TotalSessionsValue() {
  const [count, setCount] = useState("--");

  useEffect(() => {
    async function fetchSessionCount() {
      const { count, error } = await supabase
        .from("transcription_sessions")
        .select("*", { count: "exact", head: true });

      if (!error && count !== null) {
        setCount(count.toString());
      }
    }

    fetchSessionCount();
  }, []);

  return count;
}

function AcceptedModelsValue() {
  const [count, setCount] = useState("--");

  useEffect(() => {
    async function fetchAcceptedModelsCount() {
      const { count, error } = await supabase
        .from("transcription_sessions")
        .select("*", { count: "exact", head: true })
        .not("accepted_model_id", "is", null);

      if (!error && count !== null) {
        setCount(count.toString());
      }
    }

    fetchAcceptedModelsCount();
  }, []);

  return count;
}

function TranscriptionMinutesValue() {
  const [minutes, setMinutes] = useState("--");

  useEffect(() => {
    async function estimateTranscriptionMinutes() {
      // This is an estimate based on average file size
      // A more accurate calculation would require analyzing the audio files
      const { data, error } = await supabase
        .from("transcriptions")
        .select("id")
        .eq("status", "completed");

      if (!error && data) {
        // Rough estimate: average of 2 minutes per transcription
        const estimatedMinutes = data.length * 2;
        setMinutes(estimatedMinutes.toString());
      }
    }

    estimateTranscriptionMinutes();
  }, []);

  return minutes;
}

// Detailed Model Analytics
function ModelDetailedAnalytics() {
  const [modelStats, setModelStats] = useState<ModelStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModelStats() {
      setLoading(true);
      
      // Get total usage by model
      const { data: usageData, error: usageError } = await supabase
        .from("transcriptions")
        .select("model, status")
        .order("model");

      if (usageError) {
        console.error("Error fetching model usage:", usageError);
        setLoading(false);
        return;
      }

      // Get accepted models count
      const { data: acceptedData, error: acceptedError } = await supabase
        .from("transcription_sessions")
        .select("accepted_model_id, transcriptions")
        .not("accepted_model_id", "is", null);

      if (acceptedError) {
        console.error("Error fetching accepted models:", acceptedError);
        setLoading(false);
        return;
      }

      // Process the data
      const models: Record<string, ModelStat> = {};
      
      // Count usage by model
      if (usageData) {
        usageData.forEach(item => {
          if (!models[item.model]) {
            models[item.model] = {
              name: item.model,
              total: 0,
              completed: 0,
              failed: 0,
              accepted: 0,
              successRate: '0%',
              acceptanceRate: '0%'
            };
          }
          
          models[item.model].total++;
          
          if (item.status === "completed") {
            models[item.model].completed++;
          } else if (item.status === "failed") {
            models[item.model].failed++;
          }
        });
      }
      
      // Count accepted models
      if (acceptedData) {
        acceptedData.forEach(session => {
          const modelId = session.accepted_model_id;
          
          // Find which model this ID belongs to
          Object.keys(models).forEach(modelName => {
            // This is a simplified way to match - ideally we'd have a direct ID to model name mapping
            const transcriptionsObj = session.transcriptions as Record<string, any> | null;
            const matchesFromTranscriptions = transcriptionsObj && 
              Object.entries(transcriptionsObj).some(
                ([key, value]) => value?.id === modelId && key.includes(modelName)
              );
            
            if (matchesFromTranscriptions) {
              models[modelName].accepted++;
            }
          });
        });
      }
      
      // Calculate success rates and format for display
      const statsArray = Object.values(models).map(model => {
        const successRate = model.total > 0 
          ? ((model.completed / model.total) * 100).toFixed(1) 
          : '0';
        
        const acceptanceRate = model.completed > 0 
          ? ((model.accepted / model.completed) * 100).toFixed(1) 
          : '0';
        
        return {
          ...model,
          successRate: `${successRate}%`,
          acceptanceRate: `${acceptanceRate}%`
        };
      });
      
      setModelStats(statsArray);
      setLoading(false);
    }

    fetchModelStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-4">Loading model statistics...</div>;
  }

  return (
    <Table>
      <TableCaption>Detailed statistics for each transcription model</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Model</TableHead>
          <TableHead className="text-right">Total Runs</TableHead>
          <TableHead className="text-right">Completed</TableHead>
          <TableHead className="text-right">Failed</TableHead>
          <TableHead className="text-right">Success Rate</TableHead>
          <TableHead className="text-right">Times Accepted</TableHead>
          <TableHead className="text-right">Acceptance Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {modelStats.map((model) => (
          <TableRow key={model.name}>
            <TableCell className="font-medium">{model.name}</TableCell>
            <TableCell className="text-right">{model.total}</TableCell>
            <TableCell className="text-right">{model.completed}</TableCell>
            <TableCell className="text-right">{model.failed}</TableCell>
            <TableCell className="text-right">{model.successRate}</TableCell>
            <TableCell className="text-right">{model.accepted}</TableCell>
            <TableCell className="text-right">{model.acceptanceRate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
