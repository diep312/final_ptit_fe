import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartCardProps {
  title: string;
  data?: PieChartData[]; // optional: card can fetch its own data
  initialYear?: number;
  initialMonth?: number;
  initialLimit?: number;
  initialWindow?: 'day' | 'month' | 'year';
  initialDay?: string; // YYYY-MM-DD
}

export const PieChartCard = ({ title, data: initialData, initialYear, initialMonth, initialLimit = 3, initialWindow, initialDay }: PieChartCardProps) => {
  const { api, safeRequest } = useApi()
  const now = new Date()
  const [year, setYear] = useState<number>(initialYear ?? now.getFullYear())
  const [month, setMonth] = useState<number>(initialMonth ?? (now.getMonth() + 1))
  const [limit, setLimit] = useState<number>(initialLimit)
  const [data, setData] = useState<PieChartData[]>(initialData ?? [])
  const [loading, setLoading] = useState(false)

  // Sync with parent-provided data updates (so dashboard-level fetch populates card)
  useEffect(() => {
    if (initialData) setData(initialData)
  }, [initialData])

  const load = async (opts?: { year?: number; month?: number; limit?: number; day?: string }) => {
    setLoading(true)
    await safeRequest(async () => {
      const q: Record<string, string | number> = {}
      if (opts?.year) q.year = opts.year
      if (opts?.month) q.month = opts.month
      if (opts?.limit) q.limit = opts.limit
      if (opts?.day) q.day = opts.day
      const qs = new URLSearchParams(q as Record<string, string>).toString()
      const path = `/admin/stats${qs ? `?${qs}` : ''}`
      const res = await api.get(path) as any
      if (res?.success && res.data) {
        const pie = (res.data.pie || []).map((p: any, idx: number) => ({ ...p, color: idx % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }))
        setData(pie)
      }
    })
    setLoading(false)
  }

  useEffect(() => {
    // if no initialData provided, fetch defaults
    if (!initialData) load({ year, month, limit, day: initialDay })
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
            {Array.from({ length: 3 }).map((_, i) => {
              const y = now.getFullYear() - i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="text-xs p-1 rounded border">
            {Array.from({ length: 12 }).map((_, i) => {
              const m = i + 1
              return <option key={m} value={m}>{m}</option>
            })}
          </select>
          <input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="text-xs w-14 p-1 rounded border" />
          <button disabled={loading} onClick={() => {
            const opts: any = { year, month, limit }
            if (initialWindow === 'day' && initialDay) opts.day = initialDay
            load(opts)
          }} className="text-xs ml-2 px-2 py-1 bg-primary text-white rounded">Áp dụng</button>
        </div>
      </div>

      <div className="h-52 flex items-center justify-center">
        {loading ? (
          <div className="text-sm text-muted-foreground">Đang tải...</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend 
                verticalAlign="middle" 
                align="right"
                layout="vertical"
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
