
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export default function TranscriptionTimeChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTranscriptionTimeData() {
      setLoading(true);
      
      // Get completed transcriptions from the last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data: transcriptions, error } = await supabase
        .from("transcriptions")
        .select("created_at")
        .eq("status", "completed")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at");
      
      if (error) {
        console.error("Error fetching transcription time data:", error);
        setLoading(false);
        return;
      }
      
      // Group by day and count
      const dailyCounts = {};
      
      // Initialize all days in the range
      for (let i = 0; i < 30; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        dailyCounts[dateStr] = 0;
      }
      
      // Count transcriptions by day
      transcriptions?.forEach(item => {
        const dateStr = format(new Date(item.created_at), "yyyy-MM-dd");
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr]++;
        }
      });
      
      // Convert to minutes (rough estimate: 2 minutes per transcription)
      const minutesData = Object.entries(dailyCounts)
        .map(([date, count]) => ({
          date: format(new Date(date), "MMM dd"),
          minutes: Number(count) * 2, // Rough estimate
          count: Number(count)
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setData(minutesData);
      setLoading(false);
    }
    
    fetchTranscriptionTimeData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading chart data...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis label={{ value: 'Minutes', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value, name) => [
          name === 'minutes' ? `${value} minutes` : value,
          name === 'minutes' ? 'Estimated Time' : 'Transcriptions'
        ]} />
        <Legend />
        <Bar dataKey="minutes" fill="#8884d8" name="Transcription Minutes" />
        <Bar dataKey="count" fill="#82ca9d" name="Number of Transcriptions" />
      </BarChart>
    </ResponsiveContainer>
  );
}
