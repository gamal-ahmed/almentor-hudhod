
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Define color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AcceptedModelsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAcceptedModelsData() {
      setLoading(true);
      
      // Get all sessions with an accepted model
      const { data: sessions, error: sessionsError } = await supabase
        .from("transcription_sessions")
        .select("accepted_model_id")
        .not("accepted_model_id", "is", null);
      
      if (sessionsError) {
        console.error("Error fetching accepted models:", sessionsError);
        setLoading(false);
        return;
      }
      
      // For each accepted model ID, get the corresponding model name
      const modelCounts = {};
      
      await Promise.all(
        sessions.map(async (session) => {
          const { data: transcription, error: transcriptionError } = await supabase
            .from("transcriptions")
            .select("model")
            .eq("id", session.accepted_model_id)
            .single();
          
          if (transcriptionError) {
            console.warn(`Couldn't find model for ID ${session.accepted_model_id}`);
            return;
          }
          
          const modelName = transcription?.model || "Unknown";
          
          if (!modelCounts[modelName]) {
            modelCounts[modelName] = 0;
          }
          modelCounts[modelName]++;
        })
      );
      
      // Format for chart
      const chartData = Object.entries(modelCounts).map(([name, value]) => ({
        name,
        value
      }));
      
      setData(chartData);
      setLoading(false);
    }
    
    fetchAcceptedModelsData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading chart data...</div>;
  }

  if (data.length === 0) {
    return <div className="flex justify-center items-center h-full">No accepted models data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} acceptances`, 'Accepted']} 
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
