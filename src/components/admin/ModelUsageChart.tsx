
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Define color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ModelUsageChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchModelUsageData() {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("transcriptions")
        .select("model, status");
      
      if (error) {
        console.error("Error fetching model usage data:", error);
        setLoading(false);
        return;
      }
      
      // Process data to count usage by model
      const modelCounts = {};
      
      data?.forEach(item => {
        if (!modelCounts[item.model]) {
          modelCounts[item.model] = 0;
        }
        modelCounts[item.model]++;
      });
      
      // Format for chart
      const chartData = Object.entries(modelCounts).map(([name, value]) => ({
        name,
        value
      }));
      
      setData(chartData);
      setLoading(false);
    }
    
    fetchModelUsageData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-full">Loading chart data...</div>;
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
          formatter={(value) => [`${value} uses`, 'Usage']} 
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
