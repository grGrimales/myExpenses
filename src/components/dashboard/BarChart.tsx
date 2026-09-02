import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DailyCategoryExpense } from "@/types/expense";
import BarChartClient from "./BarChartClient";

interface BarChartProps {
  rows: DailyCategoryExpense[];
}

export default function BarChart({ rows }: BarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Evolución de gastos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChartClient rows={rows} />
      </CardContent>
    </Card>
  );
}
