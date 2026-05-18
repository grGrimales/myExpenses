import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type DailyExpense } from "@/types/expense";
import BarChartClient from "./BarChartClient";

interface BarChartProps {
  dailyData: DailyExpense[];
}

export default function BarChart({ dailyData }: BarChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Evolución de gastos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChartClient dailyData={dailyData} />
      </CardContent>
    </Card>
  );
}
