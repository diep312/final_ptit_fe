import React from "react";
import { MoreHorizontal, Clock } from "lucide-react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export type BarDatum = Record<string, string | number>;
export type PieDatum = Record<string, string | number>;

type CommonProps = {
  title: string;
  height?: number | string; // e.g. 280 or "280px"
  legend?: boolean;
  tooltip?: boolean;
  className?: string;
};

export type BarOptions = {
  type: "bar";
  data: BarDatum[];
  xField: string; // category field
  yField: string; // value field
  color?: string; // CSS color
  grid?: boolean;
  yMax?: number; // optional Y-axis max (e.g. capacity/2)
  valueFormatter?: (value: number) => string | number;
} & CommonProps;

export type PieOptions = {
  type: "pie";
  data: PieDatum[];
  nameField: string;
  valueField: string;
  colors?: string[]; // slice colors
  valueFormatter?: (value: number) => string | number;
} & CommonProps;

export type ConferenceStatisticCardProps = BarOptions | PieOptions;

const defaultColors = [
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
];

export const ConferenceStatisticCard: React.FC<ConferenceStatisticCardProps> = (props) => {
  const height = typeof props.height === "number" ? `${props.height}px` : props.height || "300px";

  if (props.type === "bar") {
    const { title, data, xField, yField, color = "hsl(var(--primary))", legend = false, tooltip = true, grid = true, yMax, valueFormatter, className } = props;

    const chartConfig: ChartConfig = {
      [yField]: { label: title, color },
    };

    return (
      <div className="bg-white h-fit rounded-2xl border border-gray-100 shadow-sm p-6">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />{title}
          </h2>
        </div>

        <div className="p-4" style={{ height }}>
          <ChartContainer config={chartConfig} className={className}>
            <BarChart data={data}>
              {grid && <CartesianGrid vertical={false} />}
              <XAxis dataKey={xField} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                domain={[0, typeof yMax === "number" && Number.isFinite(yMax) && yMax > 0 ? yMax : "auto"]}
                tickFormatter={(v) => String(Math.trunc(Number(v)))}
              />
              {tooltip && (
                <ChartTooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  content={<ChartTooltipContent nameKey={xField} />}
                  formatter={(value: any) => {
                    const n = Math.trunc(Number(value) || 0);
                    return [valueFormatter ? valueFormatter(n) : n, " lượt"];
                  }}
                />
              )}
              <Bar dataKey={yField} fill={color} radius={[6, 6, 0, 0]} />
              {legend && <ChartLegend content={<ChartLegendContent />} />}
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    );
  }

  const { title, data, nameField, valueField, colors = defaultColors, legend = true, tooltip = true, valueFormatter, className } = props;

  const chartConfig: ChartConfig = data.reduce((acc, d, i) => {
    const key = String(d[nameField]);
    acc[key] = { label: key, color: colors[i % colors.length] };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" />{title}</div>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="p-4" style={{ height }}>
        <ChartContainer config={chartConfig} className={className}>
          <PieChart>
            {tooltip && (
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: any, name: any) => [valueFormatter ? valueFormatter(Number(value)) : value, name]}
              />
            )}
            <Pie data={data} dataKey={valueField} nameKey={nameField} innerRadius={60} outerRadius={90} strokeWidth={2}>
              {data.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            {legend && <ChartLegend content={<ChartLegendContent />} />}
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
};

export default ConferenceStatisticCard;


