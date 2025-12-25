import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { ConferenceHeader } from "@/components/conference/ConferenceHeader";
import { ConferenceStats } from "@/components/conference/ConferenceStats";
import { ConferenceThumbnail } from "@/components/conference/ConferenceThumbnail";
import { ConferenceSchedule } from "@/components/conference/ConferenceSchedule";
import { useParams } from "react-router-dom";
import { ConferenceStatisticCard } from "@/components/conference/ConferenceStatisticCard";
import ConferenceTopBar from "@/components/conference/ConferenceTopBar";
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/use-api";

const ConferenceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { api, safeRequest } = useApi();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<{ registered: number; checkedIn: number; hourly?: { hour: string; count: number }[] }>({ registered: 0, checkedIn: 0, hourly: [] });

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

  if (loading) {
    return (
      <ConferenceLayout>
        <div className="px-6 py-6">
          <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải...</p>
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
          title: s.title ?? s.name ?? "Phiên",
          description: s.description ?? s.prerequisites ?? "",
          room: s.place ?? s.room ?? s.location ?? "",
          speaker: speakers && speakers.length > 0 ? speakers[0].name : "",
          speakers,
        };
      })
    : [];

  const hourlyData = statistics.hourly && statistics.hourly.length > 0 ? statistics.hourly.map((h) => ({ hour: h.hour, count: h.count })) : [];

  return (
    <ConferenceLayout>
      <div className="px-10 py-6">
        <ConferenceTopBar title={event?.name || "Hội nghị"} />
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
