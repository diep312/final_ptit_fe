import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";
import { MoreHorizontal, Clock } from "lucide-react";

interface BarChartData {
  name: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  data?: BarChartData[];
  initialYear?: number;
  initialWindow?: 'day' | 'month' | 'year';
  initialDay?: string;
}

export const BarChartCard = ({ title, data: initialData, initialYear, initialWindow, initialDay }: BarChartCardProps) => {
  const { api, safeRequest } = useApi()
  const now = new Date()
  const [year, setYear] = useState<number>(initialYear ?? now.getFullYear())
  const [data, setData] = useState<BarChartData[]>(initialData ?? [])
  const [loading, setLoading] = useState(false)

  // Keep local state in sync when parent passes new data
  useEffect(() => {
    if (initialData) setData(initialData)
  }, [initialData])

  const load = async (opts?: { year?: number }) => {
    setLoading(true)
    await safeRequest(async () => {
      const q: Record<string, string | number> = {}
      if (opts?.year) q.year = opts.year
      if ((opts as any)?.day) q.day = (opts as any).day
      const qs = new URLSearchParams(q as Record<string, string>).toString()
      const path = `/admin/stats${qs ? `?${qs}` : ''}`
      const res = await api.get(path) as any
      if (res?.success && res.data) {
        const bar = (res.data.bar || []).map((b: any) => ({ name: String(b.month), value: b.value }))
        setData(bar)
      }
    })
    setLoading(false)
  }

  useEffect(() => {
    if (!initialData) {
      const opts: any = { year }
      if (initialWindow === 'day' && initialDay) opts.day = initialDay
      load(opts)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const monthName = payload[0].payload.name;
      const count = payload[0].value;
      
      return (
        <div className="bg-card border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1 text-primary">
            Tháng {monthName}
          </p>
          <p className="text-sm text-muted-foreground">
            Số hội nghị: <span className="font-medium text-foreground">{count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card h-fit rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="h-4 w-4" />
          {title}
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))} 
            className="text-xs px-2 py-1 rounded border border-gray-200 bg-background"
          >
            {Array.from({ length: 1 }).map((_, i) => {
              const y = now.getFullYear() - i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          <button 
            disabled={loading} 
            onClick={() => {
              const opts: any = { year }
              if (initialWindow === 'day' && initialDay) opts.day = initialDay
              load(opts)
            }} 
            className="text-xs px-3 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
          >
            Áp dụng
          </button>
        </div>
      </div>
      <div className="p-4 h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                allowDecimals={false}
                domain={[0, 10]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.2)' }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
