import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/use-api";

export const DashboardCalendar = () => {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const todayDate = now.getDate();

  const { api, safeRequest } = useApi();
  const [eventsByDate, setEventsByDate] = useState<Record<string, { id: string; name: string; start: string; end: string; timeRange: string; color: string }[]>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res = await safeRequest(() => api.get('/organizer/events/my-events'));
      const raw = (res as any) ?? [];
      const data = raw.data ?? raw;
      const items = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      if (!mounted) return;

      const map: Record<string, any[]> = {};
      const COLORS = ['#60a5fa', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
      const getColor = (key: string) => {
        const hash = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        return COLORS[hash % COLORS.length];
      };

      for (const it of items) {
        const start = it.start_time ? new Date(it.start_time) : null;
        const end = it.end_time ? new Date(it.end_time) : null;
        if (!start || !end) continue;
        const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        while (cur <= last) {
          const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
          const timeRange = `${start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
          map[key] = map[key] || [];
          map[key].push({ id: it._id || it.id || String(it._id || it.id), name: it.name || it.title || 'Hội nghị', start: it.start_time, end: it.end_time, timeRange, color: getColor(it._id || it.id || it.name || String(Math.random())) });
          cur.setDate(cur.getDate() + 1);
        }
      }

      setEventsByDate(map);
    };

    load();
    return () => { mounted = false };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }
    
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Only treat a day as 'today' when the calendar is showing the real current month/year
      const isCurrentMonthView = currentMonth === now.getMonth() && currentYear === now.getFullYear();
      const isToday = isCurrentMonthView && day === todayDate;
      const isPassed = isCurrentMonthView ? day < todayDate : false;
      const isUpcoming = isCurrentMonthView ? day > todayDate : true;

      let bgColor = "";
      let textColor = "";

      if (isToday) {
        bgColor = "#000000";
        textColor = "text-white";
      } else if (isPassed) {
        bgColor = "#DCDCDC";
        textColor = "text-foreground";
      } else if (isUpcoming) {
        bgColor = "#FFFFFF";
        textColor = "text-foreground";
      }

      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const eventsForDay = eventsByDate[dateKey] || [];
      const tooltip = eventsForDay.length > 0 ? eventsForDay.map(ev => `${ev.name} (${ev.timeRange})`).join('\n') : undefined;

      days.push(
        <button
          key={day}
          title={tooltip}
          className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium transition-colors ${textColor}`}
          style={{ backgroundColor: bgColor }}
        >
          <div>{day}</div>
          <div className="flex gap-1 mt-1">
            {eventsForDay.slice(0, 3).map((ev, idx) => (
              <span
                key={idx}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: ev.color }}
                title={`${ev.name} (${ev.timeRange})`}
              />
            ))}
            {eventsForDay.length > 3 && (
              <span className="text-xs text-muted-foreground">+{eventsForDay.length - 3}</span>
            )}
          </div>
        </button>
      );
    }
    return days;
  };

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: "#F4F4F6" }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-lg bg-white hover:bg-white/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <h3 className="font-heading font-semibold text-lg">
            {monthNames[currentMonth]} năm {currentYear}
          </h3>
          {/* <button
            onClick={() => {
              setCurrentMonth(now.getMonth());
              setCurrentYear(now.getFullYear());
            }}
            className="text-sm text-primary underline"
          >
            Hôm nay
          </button> */}
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg bg-white hover:bg-white/80 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {generateCalendarDays()}
      </div>
    </div>
  );
};
