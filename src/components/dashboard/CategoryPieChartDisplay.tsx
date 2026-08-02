"use client";

import { formatCurrency } from "@/lib/utils/format";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface CategoryPieChartDisplayProps {
  data: PieDataItem[];
}

export default function CategoryPieChartDisplay({
  data,
}: CategoryPieChartDisplayProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
        No hay gastos en este período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={55}
          outerRadius={80}
          dataKey="value"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [
            typeof value === "number" ? formatCurrency(value) : String(value),
            "Total",
          ]}
          contentStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--card-foreground)",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value: string) =>
            value.length > 14 ? value.slice(0, 13) + "…" : value
          }
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
