import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchBar } from "@/components/common/SearchBar";
import { DashboardCalendar } from "@/components/common/DashboardCalendar";
import { ConferenceStatistics } from "@/components/common/ConferenceStatistics";
import { ConferenceList } from "@/components/common/ConferenceList";
import { useApi } from "@/hooks/use-api";
import { format } from "date-fns";

type StatItem = {
  id: number;
  title: string;
  count: string;
  subtitle: string;
};

interface Event {
  _id: string;
  name: string;
  category_id: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  thumbnail: string;
  logo: string;
  description?: string;
  tags?: string[];
}

interface Conference {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  attendees: number;
  logo: string;
  image: string;
  thumbnail: string;
  description: string;
  tags: string[];
}

interface GroupedConferences {
  date: string;
  displayDate: string;
  conferences: Conference[];
}

const categoryMap: { [key: string]: string } = {
  TECHNOLOGY: "Công nghệ",
  ECONOMY: "Kinh tế",
  EDUCATION: "Giáo dục",
  HEALTH: "Y tế",
  ENVIRONMENT: "Môi trường",
};

const Dashboard = () => {
  const currentDate = new Date();
  const { api, safeRequest } = useApi();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatItem[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const res = await safeRequest(async () => api.get('/organizer/events/dashboard-stats'));
      const payload: any = (res as any)?.data ?? res ?? null;
      const topToday = Array.isArray(payload?.top_today) ? payload.top_today : [];

      const stats: StatItem[] = topToday.slice(0, 3).map((ev: any, idx: number) => ({
        id: idx + 1,
        title: ev?.name || 'Hội nghị',
        count: `${ev?.registrations ?? 0} lượt`,
        subtitle: 'Tổng lượt đăng ký',
      }));

      setStatistics(stats);
    };

    loadStats();
  }, [api, safeRequest]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        if (searchTerm.trim()) {
          // Search events
          const response = await safeRequest<{ status: number; success: boolean; message: string; data: { items: Event[] } }>(async () => {
            return await api.get<{ status: number; success: boolean; message: string; data: { items: Event[] } }>(
              `/organizer/events/search?q=${encodeURIComponent(searchTerm)}&limit=100`
            );
          });
          
          if (response) {
            const payload: any = (response as any)?.data ?? response;
            const eventsData: Event[] = payload?.data?.items ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
            setEvents(Array.isArray(eventsData) ? eventsData : []);
          }
        } else {
          // Get all events
          const response = await safeRequest<{ status: number; success: boolean; message: string; data: Event[] }>(async () => {
            return await api.get<{ status: number; success: boolean; message: string; data: Event[] }>(
              "/organizer/events/my-events"
            );
          });
          
          if (response) {
            // Handle wrapped response: { status, success, message, data: [...] }
            const data = response?.data || response;
            const eventsData = Array.isArray(data) ? data : [];
            setEvents(eventsData);
          }
        }
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [searchTerm, api, safeRequest]);

  // Transform events to conferences and group by date
  const conferenceGroups = useMemo(() => {
    const conferences: Conference[] = events.map((event) => {
      const startDate = new Date(event.start_time);
      const dateStr = format(startDate, "dd/MM/yyyy");
      
      return {
        id: event._id,
        title: event.name,
        category: categoryMap[event.category_id] || event.category_id,
        date: dateStr,
        location: event.location,
        attendees: event.capacity || 0,
        logo: event.logo || "/placeholder.svg",
        image: event.logo || "/placeholder.svg",
        thumbnail: event.thumbnail || "/placeholder.svg",
        description: event.description || "",
        tags: event.tags || [],
      };
    });

    // Group by date
    const grouped = conferences.reduce((acc, conference) => {
      const dateKey = conference.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(conference);
      return acc;
    }, {} as { [key: string]: Conference[] });

    // Convert to array and format dates
    const groups: GroupedConferences[] = Object.entries(grouped)
      .sort(([dateA], [dateB]) => {
        const [dayA, monthA, yearA] = dateA.split('/').map(Number);
        const [dayB, monthB, yearB] = dateB.split('/').map(Number);
        const dateObjA = new Date(yearA, monthA - 1, dayA);
        const dateObjB = new Date(yearB, monthB - 1, dayB);
        return dateObjA.getTime() - dateObjB.getTime();
      })
      .map(([date, confs]) => {
        const [day, month, year] = date.split('/');
        return {
          date: date,
          displayDate: `${day} tháng ${month} năm ${year}`,
          conferences: confs,
        };
      });

    return groups;
  }, [events]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16">
        {/* Left Column - Search, Calendar & Statistics */}
        <div className="space-y-4 overflow-y-auto">
          <SearchBar onSearch={setSearchTerm} searchTerm={searchTerm} />
          <DashboardCalendar />
          <ConferenceStatistics stats={statistics} />
        </div>

        {/* Right Column - Conference List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          </div>
        ) : conferenceGroups.length === 0 ? (
          <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                {searchTerm.trim()
                  ? "Không tìm thấy hội nghị nào với từ khóa này."
                  : "Không có hội nghị nào, hãy bắt đầu tạo hội nghị ngay."}
              </p>
            </div>
          </div>
        ) : (
          <ConferenceList 
            groupedConferences={conferenceGroups}
            currentDate={currentDate}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
