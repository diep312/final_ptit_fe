import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ConferenceCard } from "./ConferenceCard";
import { Button } from "@/components/ui/button";

interface Conference {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  attendees: number;
  logo: string;
  image: string;
  description: string;
  tags: string[];
}

interface GroupedConferences {
  date: string;
  displayDate: string;
  conferences: Conference[];
}

interface ConferenceListProps {
  groupedConferences: GroupedConferences[];
  currentDate: Date;
}

export const ConferenceList = ({
  groupedConferences,
  currentDate,
}: ConferenceListProps) => {
  const [visibleDate, setVisibleDate] = useState<string>("");
  const [enlargedCardId, setEnlargedCardId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const dateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // ✅ Initialize first visible date
  useEffect(() => {
    if (groupedConferences.length > 0) {
      setVisibleDate(groupedConferences[0].displayDate);
    }
  }, [groupedConferences]);

  // ✅ Detect which date section is at top (for sticky header)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = scrollRef.current?.scrollTop || 0;
      const offset = 120; // adjust based on header height

      for (const group of groupedConferences) {
        const el = dateRefs.current[group.date];
        if (el) {
          const top = el.offsetTop - offset;
          const bottom = top + el.offsetHeight;

          if (scrollTop >= top && scrollTop < bottom) {
            setVisibleDate(group.displayDate);
            break;
          }
        }
      }
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [groupedConferences]);

  // ✅ Observe which card is visible at the top
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const topId = visible[0].target.getAttribute("data-id");
          if (topId) setEnlargedCardId(topId);
        }
      },
      {
        root: scrollRef.current,
        threshold: 0.6, // 60% visible
      }
    );

    Object.values(cardRefs.current).forEach((el) => el && observer.observe(el));

    return () => observer.disconnect();
  }, [groupedConferences]);

  const getHeaderText = () => {
    if (!visibleDate) return "";

    const today = new Date(currentDate);
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = `${String(today.getDate()).padStart(2, "0")} tháng ${String(
      today.getMonth() + 1
    ).padStart(2, "0")} năm ${today.getFullYear()}`;
    const tomorrowStr = `${String(
      tomorrow.getDate()
    ).padStart(2, "0")} tháng ${String(
      tomorrow.getMonth() + 1
    ).padStart(2, "0")} năm ${tomorrow.getFullYear()}`;

    if (visibleDate === todayStr) return `Hôm nay | ${visibleDate}`;
    if (visibleDate === tomorrowStr) return `Ngày mai | ${visibleDate}`;
    return visibleDate;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background z-10 pb-4 border-b mb-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold">{getHeaderText()}</h1>
        </div>
      </div>

      {/* Scrollable List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pr-2">
        {groupedConferences.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-lg text-muted-foreground">
              Không có hội nghị nào, hãy bắt đầu tạo hội nghị ngay.
            </p>
          </div>
        ) : (
          groupedConferences.map((group) => (
            <div
              key={group.date}
              ref={(el) => (dateRefs.current[group.date] = el)}
            >
              <h2 className="font-heading text-xl font-semibold mb-4">
                {group.displayDate}
              </h2>

              <div className="space-y-6">
                {group.conferences.map((conference) => (
                  <div
                    key={conference.id}
                    data-id={conference.id}
                    ref={(el) => (cardRefs.current[conference.id] = el)}
                  >
                    <ConferenceCard
                      {...conference}
                      isEnlarged={enlargedCardId === conference.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
