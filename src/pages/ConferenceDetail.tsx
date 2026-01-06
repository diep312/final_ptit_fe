import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { ConferenceHeader } from "@/components/conference/ConferenceHeader";
import { ConferenceStats } from "@/components/conference/ConferenceStats";
import { ConferenceThumbnail } from "@/components/conference/ConferenceThumbnail";
import { ConferenceSchedule } from "@/components/conference/ConferenceSchedule";
import { useParams } from "react-router-dom";
import { ConferenceStatisticCard } from "@/components/conference/ConferenceStatisticCard";
import ConferenceTopBar from "@/components/conference/ConferenceTopBar";
import { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/use-api";

const ConferenceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { api, safeRequest } = useApi();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<{ registered: number; checkedIn: number; hourly?: { hour: string; count: number }[] }>({ registered: 0, checkedIn: 0, hourly: [] });
  const statsPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);

      // load event detail
      const evRes = await safeRequest(() => api.get(`/organizer/events/${id}`));
      const evData = (evRes as any)?.data ?? evRes ?? null;
      if (evData) setEvent(evData);

      // load sessions (backend should expose: GET /organizer/events/:id/sessions)
        const sRes = await safeRequest(() => api.get(`/organizer/events/${id}/sessions`));
        // backend may return wrapped responses: { status, success, message, data: { data: sessions, total } }
        // or { status, success, message, data: sessions } or plain array
        const rawS = (sRes as any) ?? [];
        const maybeData = rawS.data ?? rawS
        const sessionsArray = Array.isArray(maybeData)
          ? maybeData
          : Array.isArray(maybeData?.data)
          ? maybeData.data
          : [];
        setSessions(sessionsArray);

      // load statistics (backend should expose: GET /organizer/events/:id/statistics)
      const stRes = await safeRequest(() => api.get(`/organizer/events/${id}/statistics`));
      const stData = (stRes as any)?.data ?? stRes ?? null;
      if (stData) {
        setStatistics({
          registered: stData.registered ?? stData.totalRegistrations ?? 0,
          checkedIn: stData.checkedIn ?? stData.totalCheckedIn ?? 0,
          hourly: stData.hourly ?? stData.hourly_checkins ?? [],
        });
      }

      setLoading(false);
    };

    load();
  }, [id, api, safeRequest]);

  // Poll statistics every 60s (semi-realtime) without reloading other data
  useEffect(() => {
    if (!id) return;

    let isActive = true;
    let isFetching = false;

    const fetchStats = async () => {
      if (!isActive || isFetching) return;
      isFetching = true;
      try {
        const stRes = await safeRequest(() => api.get(`/organizer/events/${id}/statistics`));
        const stData = (stRes as any)?.data ?? stRes ?? null;
        if (isActive && stData) {
          setStatistics({
            registered: stData.registered ?? stData.totalRegistrations ?? 0,
            checkedIn: stData.checkedIn ?? stData.totalCheckedIn ?? 0,
            hourly: stData.hourly ?? stData.hourly_checkins ?? [],
          });
        }
      } finally {
        isFetching = false;
      }
    };

    // Start interval (also do an immediate refresh once mounted)
    fetchStats();
    statsPollingRef.current = setInterval(fetchStats, 60_000);

    return () => {
      isActive = false;
      if (statsPollingRef.current) {
        clearInterval(statsPollingRef.current);
        statsPollingRef.current = null;
      }
    };
  }, [id, api, safeRequest]);

  if (loading) {
    return (
      <ConferenceLayout>
        <div className="px-6 py-6">
          <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
            <div className="text-center">
         
            </div>
          </div>
        </div>
      </ConferenceLayout>
    );
  }

  const participation = statistics.registered > 0 ? `${Math.round((statistics.checkedIn / statistics.registered) * 100)}%` : "0%";

      const schedule = sessions.length
    ? sessions.map((s: any) => {
        // session fields from backend: start_time, end_time, place, title, description, speakers (array)
        const start = s.start_time ? new Date(s.start_time) : s.start ? new Date(s.start) : null;
        const end = s.end_time ? new Date(s.end_time) : s.end ? new Date(s.end) : null;
        const timeStr = start && end
          ? `${start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`
          : s.time ?? "";

        const speakers = Array.isArray(s.speakers)
          ? s.speakers.map((sp: any) => ({ name: sp.full_name ?? sp.name ?? sp.title ?? "", avatarUrl: sp.photo_url ?? sp.avatar ?? sp.avatar_url }))
          : s.speaker
          ? [ { name: s.speaker } ]
          : [];

        return {
          time: timeStr,
          startAt: s.start_time ?? s.start ?? undefined,
          endAt: s.end_time ?? s.end ?? undefined,
          title: s.title ?? s.name ?? "Phiên",
          description: s.description ?? s.prerequisites ?? "",
          room: s.place ?? s.room ?? s.location ?? "",
          speaker: speakers && speakers.length > 0 ? speakers[0].name : "",
          speakers,
        };
      })
    : [];

  const buildHourlySeries = () => {
    const raw = Array.isArray(statistics.hourly) ? statistics.hourly : [];

    const byHourLabel: Record<string, number> = {};
    for (const h of raw) {
      const key = h?.hour;
      const count = Math.trunc(Number(h?.count) || 0);

      // backend hour keys look like: YYYY-MM-DDTHH:00 (ISO hour bucket)
      const d = key ? new Date(key) : null;
      const label = d && !isNaN(d as any)
        ? `${String(d.getHours()).padStart(2, "0")}:00`
        : String(key ?? "");

      if (!label) continue;
      byHourLabel[label] = (byHourLabel[label] || 0) + count;
    }

    // If event is single-day, show only hours in its timeframe; else show full day.
    let startHour = 0;
    let endHour = 23;
    try {
      const evStart = event?.start_time ? new Date(event.start_time) : null;
      const evEnd = event?.end_time ? new Date(event.end_time) : null;
      if (evStart && evEnd && !isNaN(evStart as any) && !isNaN(evEnd as any)) {
        const sameDay = evStart.getFullYear() === evEnd.getFullYear() && evStart.getMonth() === evEnd.getMonth() && evStart.getDate() === evEnd.getDate();
        if (sameDay) {
          startHour = Math.max(0, Math.min(23, evStart.getHours()));
          endHour = Math.max(0, Math.min(23, evEnd.getHours()));
          if (endHour < startHour) {
            startHour = 0;
            endHour = 23;
          }
        }
      }
    } catch {
      // ignore
    }

    const series: { hour: string; count: number }[] = [];
    for (let h = startHour; h <= endHour; h++) {
      const label = `${String(h).padStart(2, "0")}:00`;
      series.push({ hour: label, count: Math.trunc(byHourLabel[label] || 0) });
    }

    // If no keys matched and series is empty (shouldn't happen), show a few default columns.
    return series.length > 0 ? series : [
      { hour: "08:00", count: 0 },
      { hour: "12:00", count: 0 },
      { hour: "16:00", count: 0 },
    ];
  };

  const hourlyData = buildHourlySeries();
  const maxCount = hourlyData.reduce((m, p) => Math.max(m, Math.trunc(Number(p?.count) || 0)), 0);
  // Scale Y-axis to the next multiple of 10 based on current max count.
  // Examples: 1 -> 10, 47 -> 50. Keep a minimum of 10 so the chart isn't flat.
  const yMax = Math.max(10, Math.ceil(maxCount / 10) * 10);

  return (
    <ConferenceLayout>
      <div className="px-10 py-6">
        <ConferenceTopBar title={event?.name || "Hội nghị"} thumbnail={event?.thumbnail} />
        <div id="dashboard" className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-14 items-stretch">
            <div className="xl:col-span-7 space-y-5">
              <ConferenceHeader
                conference={{
                  startDate: event?.start_time ? new Date(event.start_time).toLocaleString("vi-VN") : "",
                  endDate: event?.end_time ? new Date(event.end_time).toLocaleString("vi-VN") : "",
                  location: event?.location || "",
                  startAt: event?.start_time,
                  endAt: event?.end_time,
                }}
              />
              <ConferenceStats
                stats={{
                  registered: statistics.registered,
                  checkedIn: statistics.checkedIn,
                  participation,
                }}
              />
            </div>

            <div className="xl:col-span-5">
              <ConferenceThumbnail image={event?.thumbnail || event?.image || "/placeholder.svg"} />
            </div>
          </div>

          <div id="schedule" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {schedule.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-2">Lịch trình hội nghị</h3>
                <p className="text-sm text-muted-foreground">Không có phiên hội nghị</p>
              </div>
            ) : (
              <ConferenceSchedule schedule={schedule} />
            )}

            <ConferenceStatisticCard
              type="bar"
              title="Thống kê giờ check-in"
              data={hourlyData}
              xField="hour"
              yField="count"
              height={400}
              grid
              yMax={yMax}
            />
          </div>

          <div id="registrations" />
          <div id="edit" />
        </div>
      </div>
    </ConferenceLayout>
  );
};

export default ConferenceDetail;
