import React from "react";
import { CalendarClock } from "lucide-react";
import { ScheduleCard } from "./ScheduleCard";
import type { ScheduleSpeaker } from "./ScheduleCard";

export interface ScheduleItem {
  time: string;
  startAt?: string; // ISO datetime
  endAt?: string; // ISO datetime
  title: string;
  speaker: string; // fallback single speaker name
  location?: string; // legacy key
  description?: string;
  room?: string;
  speakers?: ScheduleSpeaker[];
}

export interface ConferenceScheduleProps {
  schedule: ScheduleItem[];
}

export const ConferenceSchedule: React.FC<ConferenceScheduleProps> = ({
  schedule,
}) => {
  const parseTimeRange = (range: string): { start: string; end: string } => {
    const [start, end] = range.split("-").map((s) => s.trim());
    return { start: start || "", end: end || "" };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          Lịch trình hội nghị
        </h2>
        <button className="text-sm text-primary hover:underline">Xem thêm</button>
      </div>

      <div className="space-y-8 max-h-96 overflow-auto">
        {schedule.map((item, index) => {
          const { start, end } = parseTimeRange(item.time);
          const speakers = item.speakers && item.speakers.length > 0 ? item.speakers : [{ name: item.speaker }];
          const room = item.room || item.location;
          return (
            <ScheduleCard
              key={index}
              startTime={start}
              endTime={end}
              startAt={item.startAt}
              endAt={item.endAt}
              title={item.title}
              description={item.description}
              room={room}
              speakers={speakers}
            />
          );
        })}
      </div>
    </div>
  );
};
