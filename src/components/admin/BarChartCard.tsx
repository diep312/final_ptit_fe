import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";

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

  return (
    <div className="bg-secondary rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span>📊</span>
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="text-xs p-1 rounded border">
            {Array.from({ length: 5 }).map((_, i) => {
              const y = now.getFullYear() - i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          <button disabled={loading} onClick={() => {
            const opts: any = { year }
            if (initialWindow === 'day' && initialDay) opts.day = initialDay
            load(opts)
          }} className="text-xs ml-2 px-2 py-1 bg-primary text-white rounded">Áp dụng</button>
        </div>
      </div>
      <div className="h-56">
        {loading ? (
          <div className="flex items-center justify-center h-full">Đang tải...</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
