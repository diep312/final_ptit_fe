import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Search, Calendar, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";

interface Conference {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  organizer: string;
  contact: string;
  status: "ongoing" | "upcoming" | "ended";
  isVisible: boolean;
  startTime?: string;
  endTime?: string;
}

const AdminConferences = () => {
  const { api, safeRequest } = useApi()
  const [conferences, setConferences] = useState<Conference[]>([])
  const [rawMapped, setRawMapped] = useState<Conference[]>([])
  const [organizers, setOrganizers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStart, setFilterStart] = useState<string>('') // yyyy-mm-dd
  const [filterEnd, setFilterEnd] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | Conference['status']>('all')

  const load = async () => {
    setLoading(true)
    await safeRequest(async () => {
      const res = (await api.get('/admin/events')) as any
      const payload = res?.data ?? res
      const items = payload?.items || []
      const nowDt = new Date()
      const mapped = items.map((e: any) => {
        const start = e.start_time ? new Date(e.start_time) : null
        const end = e.end_time ? new Date(e.end_time) : null
        let status: Conference['status'] = 'upcoming'

        if (start && end) {
          if (nowDt >= start && nowDt <= end) status = 'ongoing'
          else if (nowDt > end) status = 'ended'
          else status = 'upcoming'
        } else if (end) {
          status = nowDt > end ? 'ended' : 'upcoming'
        } else if (start) {
          status = nowDt >= start ? 'ongoing' : 'upcoming'
        }

        return {
          id: e._id,
          name: e.name,
          startDate: start ? start.toLocaleString() : '',
          endDate: end ? end.toLocaleString() : '',
          venue: e.location,
          organizer: e.organizer?.name ?? e.organizer_id ?? '',
          contact: e.organizer?.phone ?? e.organizer?.email ?? '',
          status,
          isVisible: e.status === 'approved',
          startTime: e.start_time,
          endTime: e.end_time,
        }
      })
      setRawMapped(mapped)
      setConferences(mapped)

      // If backend returned only organizer IDs (organizer_id) without populated organizer.name,
      // fetch those organizer names and replace the ids in the UI.
      const missingIds = Array.from(new Set(items
        .filter((e: any) => !e.organizer?.name && e.organizer_id)
        .map((e: any) => e.organizer_id)
      ));

      if (missingIds.length > 0) {
        await safeRequest(async () => {
          const results = await Promise.all(missingIds.map((id) => api.get(`/admin/organizers/${id}`).catch(() => null)))
          const map = { ...organizers }
          results.forEach((r: any, idx: number) => {
            const id = missingIds[idx]
            if (!r) return
            const payload = r?.data ?? r
            const org = payload?.data ?? payload
            const name = org?.name ?? org?.full_name ?? org?.display_name ?? org?.username ?? id
            map[id] = name
          })
          setOrganizers(map)
          setRawMapped((prev) => prev.map((c) => ({ ...c, organizer: map[c.organizer] ?? c.organizer })))
          setConferences((prev) => prev.map((c) => ({ ...c, organizer: map[c.organizer] ?? c.organizer })))
        })
      }
    })
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const applyFilters = () => {
    const startBoundary = filterStart ? new Date(filterStart + 'T00:00:00') : null
    const endBoundary = filterEnd ? new Date(filterEnd + 'T23:59:59') : null

    const filtered = rawMapped.filter((ev) => {
      // search
      const q = searchQuery.trim().toLowerCase()
      if (q) {
        const hay = `${ev.name} ${ev.venue} ${ev.organizer} ${ev.contact}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      // status
      if (filterStatus !== 'all' && ev.status !== filterStatus) return false

      // date range: keep events that intersect the range
      const evStart = ev.startTime ? new Date(ev.startTime) : null
      const evEnd = ev.endTime ? new Date(ev.endTime) : null
      if (startBoundary) {
        // event must end after or on startBoundary
        if (evEnd && evEnd < startBoundary) return false
        if (!evEnd && evStart && evStart < startBoundary) return false
      }
      if (endBoundary) {
        // event must start before or on endBoundary
        if (evStart && evStart > endBoundary) return false
        if (!evStart && evEnd && evEnd > endBoundary) return false
      }

      return true
    })

    setConferences(filtered)
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterStart('')
    setFilterEnd('')
    setFilterStatus('all')
    setConferences(rawMapped)
  }

  const getStatusBadge = (status: Conference["status"]) => {
    switch (status) {
      case "ongoing":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            Đang diễn ra
          </Badge>
        );
      case "ended":
        return (
          <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">
            Đã kết thúc
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            Sắp diễn ra
          </Badge>
        );
    }
  };

  const toggleVisibility = async (id: string) => {
    const conf = conferences.find((c) => c.id === id)
    if (!conf) return
    const newVisible = !conf.isVisible
    await safeRequest(async () => {
      await api.patch(`/admin/events/${id}/visibility`, { visible: newVisible })
      setConferences((prev) => prev.map((c) => (c.id === id ? { ...c, isVisible: newVisible } : c)))
    })
  }

  const deleteConference = async (id: string) => {
    await safeRequest(async () => {
      await api.delete(`/admin/events/${id}`)
      setConferences((prev) => prev.filter((conf) => conf.id !== id))
    })
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilters() }}
              placeholder="Nhập tên sự kiện, đối tác hoặc địa điểm để tìm kiếm"
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm">Từ</label>
              <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="px-3 py-1 border rounded" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Đến</label>
              <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="px-3 py-1 border rounded" />
            </div>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-1 border rounded bg-background text-sm">
              <option value="all">Tất cả trạng thái</option>
              <option value="ongoing">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ended">Đã kết thúc</option>
            </select>

            <div className="flex items-center gap-2">
              <button onClick={applyFilters} className="px-3 py-1 bg-primary text-white rounded">Áp dụng</button>
              <button onClick={resetFilters} className="px-3 py-1 border rounded">Đặt lại</button>
              <button onClick={() => { void load() }} className="px-3 py-1 border rounded">Làm mới</button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    TÊN SỰ KIỆN
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    THỜI GIAN BẮT ĐẦU
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    THỜI GIAN KẾT THÚC
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    ĐỊA ĐIỂM
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    ĐỐI TÁC
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    TRẠNG THÁI
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    KHOÁ/MỞ KHOÁ
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    HÀNH ĐỘNG
                  </th>
                </tr>
              </thead>
              <tbody>
                {conferences.map((conference, index) => (
                  <tr
                    key={conference.id}
                    className={`border-b hover:bg-muted/50 ${
                      index % 2 === 0 ? "bg-background" : "bg-muted/20"
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium">
                      {conference.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {conference.startDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {conference.endDate}
                    </td>
                    <td className="px-6 py-4 text-sm">{conference.venue}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-muted-foreground">
                        {conference.organizer}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conference.contact}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(conference.status)}
                    </td>
                    <td className="px-6 py-4">
                      <Switch
                        checked={conference.isVisible}
                        onCheckedChange={() => toggleVisibility(conference.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteConference(conference.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Hiển thị 1 - 7 trên tổng 7 bản ghi
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
              >
                1
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
              >
                2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
              >
                3
              </Button>
              <span className="text-muted-foreground">...</span>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0 rounded-full"
              >
                10
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminConferences;
