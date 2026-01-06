import React from "react";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { start } from "repl";

export interface ScheduleSpeaker {
  name: string;
  avatarUrl?: string;
}

export interface ScheduleCardProps {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  startAt?: string | Date; // full datetime (preferred)
  endAt?: string | Date; // full datetime (preferred)
  title: string;
  description?: string;
  room?: string;
  speakers?: ScheduleSpeaker[];
}

const getInitials = (name: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

const toDate = (value?: string | Date) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateLabel = (startAt?: string | Date, endAt?: string | Date) => {
  const start = toDate(startAt);
  const end = toDate(endAt);
  if (!start) return "";

  const startLabel = start.toLocaleDateString("vi-VN");
  if (!end) return startLabel;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) return startLabel;
  return `${startLabel} - ${end.toLocaleDateString("vi-VN")}`;
};

const isHappeningNow = (
  startTime: string,
  endTime: string,
  startAt?: string | Date,
  endAt?: string | Date,
) => {
  const now = new Date();

  const startDateTime = toDate(startAt);
  const endDateTime = toDate(endAt);
  if (startDateTime && endDateTime) {
    return now >= startDateTime && now <= endDateTime;
  }

  // Backward-compatible fallback: interpret times as "today".
  const [sh, sm] = startTime.split(":").map((n) => parseInt(n, 10));
  const [eh, em] = endTime.split(":").map((n) => parseInt(n, 10));
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return false;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0, 0);
  return now >= start && now <= end;
};

const isEndedNow = (
  startTime: string,
  endTime: string,
  startAt?: string | Date,
  endAt?: string | Date,
) => {
  const now = new Date();

  const startDateTime = toDate(startAt);
  const endDateTime = toDate(endAt);
  if (startDateTime && endDateTime) {
    return now > endDateTime;
  }

  const [sh, sm] = startTime.split(":").map((n) => parseInt(n, 10));
  const [eh, em] = endTime.split(":").map((n) => parseInt(n, 10));
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return false;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0, 0);
  return now > end;
};

export const ScheduleCard: React.FC<ScheduleCardProps> = ({
  startTime,
  endTime,
  startAt,
  endAt,
  title,
  description,
  room,
  speakers = [],
}) => {
  const happening = isHappeningNow(startTime, endTime, startAt, endAt);
  const isEnded = isEndedNow(startTime, endTime, startAt, endAt);
  const dateLabel = formatDateLabel(startAt, endAt);
  console.log(speakers);

  return (
    <div className="grid grid-cols-[72px,1fr] gap-4 items-stretch">
      <div className="flex flex-col items-start justify-start text-sm text-muted-foreground pt-6">
        {dateLabel ? (
          <span className="text-lg text-black font-bold">{dateLabel}</span>
        ) : null}
        <div className="items-center flex flex-col pt-4">
          <span>{startTime}</span>
          <span>•</span>
          <span>{endTime}</span>
        </div>
      </div>

      <div
        className={cn(
          "relative rounded-2xl p-6 border transition-colors",
          happening
            ? "bg-black text-white border-black/80 shadow-[0_0_0_1px_rgba(0,0,0,0.1)]"
            : "bg-white text-foreground border-black/10",
        )}
      >
        <div className="absolute left-[0px] top-0 bottom-0 w-3 rounded-l-xl bg-black/80" />

        <div className="space-y-3">
          <h3 className={cn("text-xl font-semibold", happening ? "text-white" : "text-foreground")}>{title}</h3>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                happening
                  ? "bg-white/10 text-white ring-1 ring-white/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {happening ? "Đang diễn ra" : 
              isEnded ? "Đã kết thúc" : "Sắp diễn ra"}
            </span>
          </div>

          {description ? (
            <p className={cn("text-sm leading-relaxed line-clamp-3", happening ? "text-white/80" : "text-muted-foreground")}>{description}</p>
          ) : null}

          <div className="flex items-center gap-2 text-sm">
            <MapPin className={cn("h-4 w-4", happening ? "text-white/80" : "text-muted-foreground")} />
            <span className={cn(happening ? "text-white/90" : "text-muted-foreground")}>{room}</span>
          </div>

          {speakers.length ? (
            <div className="flex items-center gap-2 pt-2">
              {speakers.map((sp, idx) => (
                <Avatar key={idx} className="h-8 w-8 ring-2 ring-background">
                  {sp.avatarUrl ? (
                    <AvatarImage src={sp.avatarUrl} alt={sp.name} />
                  ) : (
                    <AvatarFallback className={cn(happening ? "bg-white/10 text-white" : "")}>{getInitials(sp.name)}</AvatarFallback>
                  )}
                </Avatar>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCard;


