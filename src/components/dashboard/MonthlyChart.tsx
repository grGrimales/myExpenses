import { getMonthlyTrendAction } from "@/actions/expenses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MonthlyChartDisplay from "./MonthlyChartDisplay";

interface MonthlyChartProps {
  months?: number;
}

export default async function MonthlyChart({ months = 6 }: MonthlyChartProps) {
  const result = await getMonthlyTrendAction(months);
  const data = result.success ? result.data : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Tendencia mensual
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MonthlyChartDisplay data={data} />
      </CardContent>
    </Card>
  );
}
