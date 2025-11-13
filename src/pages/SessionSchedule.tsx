import { useMemo, useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ConferenceLayout } from "@/components/layout/ConferenceLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/use-api";

type CalendarItem = {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  speaker?: { name: string; avatarUrl?: string };
  room: string;
  files?: { name: string; url?: string }[];
}; 
  
const HOUR_HEIGHT = 64; // px per hour

const COLORS = ["#60a5fa", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#38bdf8", "#f97316", "#ef4444", "#0ea5e9"];

const getColorForKey = (key: string) => {
  const hash = Array.from(key).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
};

const startOfWeek = (d: Date) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday=0
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (d: Date, days: number) => {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
};

const formatDateLabel = (d: Date) => {
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const dayOfWeek = weekdays[d.getDay()];
  const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" });
  return { dayOfWeek, dateStr };
};

const minutesSinceMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes();

const getInitials = (name?: string) => {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[p.length - 1]?.[0] || "")).toUpperCase();
};

const SessionSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const today = new Date();
    // weekStart is stateful so we can navigate between weeks
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(today));

  // rooms / places loaded from API
  const { api, safeRequest } = useApi();
  const [places, setPlaces] = useState<{ id: string; name: string }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>(undefined);
  const [newRoom, setNewRoom] = useState("");

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    speaker: "",
    files: [] as { name: string; url?: string }[],
  });

  const [speakers, setSpeakers] = useState<{ id: number; full_name: string; photo_url?: string }[]>([])

  const [event, setEvent] = useState<any | null>(null);
  const [isEditable, setIsEditable] = useState(true);

  // Scroll sync refs
  const timeScrollRef = useRef<HTMLDivElement>(null);
  const daysScrollRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<CalendarItem[]>([]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const itemsByDay = useMemo(() => {
    const filtered = items.filter((it) => it.room === (selectedRoom ?? ''));
    return weekDays.map((day) => {
      const dayItems = filtered.filter((it) => {
        const d = new Date(it.start);
        return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
      });
      return dayItems;
    });
  }, [items, selectedRoom, weekDays]);

  // Sync scroll between time column and days grid
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    // Use setTimeout to ensure DOM elements are rendered
    const timer = setTimeout(() => {
      const timeScroll = timeScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      const daysScroll = daysScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      
      if (!timeScroll || !daysScroll) return;

      let isSyncing = false;

      const handleTimeScroll = () => {
        if (isSyncing) return;
        isSyncing = true;
        if (daysScroll.scrollTop !== timeScroll.scrollTop) {
          daysScroll.scrollTop = timeScroll.scrollTop;
        }
        requestAnimationFrame(() => {
          isSyncing = false;
        });
      };

      const handleDaysScroll = () => {
        if (isSyncing) return;
        isSyncing = true;
        if (timeScroll.scrollTop !== daysScroll.scrollTop) {
          timeScroll.scrollTop = daysScroll.scrollTop;
        }
        requestAnimationFrame(() => {
          isSyncing = false;
        });
      };

      timeScroll.addEventListener('scroll', handleTimeScroll);
      daysScroll.addEventListener('scroll', handleDaysScroll);

      // Store cleanup function
      cleanup = () => {
        timeScroll.removeEventListener('scroll', handleTimeScroll);
        daysScroll.removeEventListener('scroll', handleDaysScroll);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup?.();
    };
  }, []);

  // Load event, sessions and places
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      // event
      const ev = await safeRequest(() => api.get(`/organizer/events/${id}`));
      const evData = (ev as any)?.data ?? ev ?? null;
      if (evData) {
        setEvent(evData);
        const ended = evData.end_time ? new Date(evData.end_time) < new Date() : false;
        setIsEditable(!ended);
        // Set default weekStart based on event timeframe
        try {
          const now = new Date();
          const evStart = evData.start_time ? new Date(evData.start_time) : null;
          if (evStart && now < evStart) {
            setWeekStart(startOfWeek(evStart));
          } else {
            setWeekStart(startOfWeek(now));
          }
        } catch (err) {
          // ignore
        }
      }

      // sessions for event
      const s = await safeRequest(() => api.get(`/organizer/sessions/event/${id}`));
      const sData = (s as any)?.data ?? s ?? null;
      if (sData && Array.isArray(sData.data)) {
        setItems(
          sData.data.map((it: any) => ({
            id: String(it.id),
            title: it.title,
            description: it.description,
            start: it.start_time,
            end: it.end_time,
            speaker: it.speakers && it.speakers.length > 0 ? { name: it.speakers[0].full_name || it.speakers[0].full_name, avatarUrl: it.speakers[0].photo_url || it.speakers[0].photo_url } : undefined,
            room: it.place,
            files: [],
          }))
        )
      }

      // places for event
      const p = await safeRequest(() => api.get(`/organizer/places/event/${id}`));
      const pData = (p as any)?.data ?? p ?? [];
      if (Array.isArray(pData)) {
        setPlaces(pData.map((pl: any) => ({ id: pl.id || pl._id || pl.id, name: pl.name })));
        if (pData.length > 0) setSelectedRoom(pData[0].name)
      }
      // speakers for event
      const sp = await safeRequest(() => api.get(`/organizer/speakers/event/${id}`))
      const spData = (sp as any)?.data ?? sp ?? null
      if (spData && Array.isArray(spData.data)) {
        setSpeakers(spData.data.map((s: any) => ({ id: s.id, full_name: s.full_name, photo_url: s.photo_url })))
      }
    }

    load()
  }, [id, api, safeRequest])

  const goPrevWeek = () => setWeekStart((ws) => addDays(ws, -7));
  const goNextWeek = () => setWeekStart((ws) => addDays(ws, 7));

  const handleAddRoom = () => {
    const v = newRoom.trim();
    if (!v || !id) return;
    // Call API to create place
    (async () => {
      const res = await safeRequest(() => api.post('/organizer/places', { event_id: id, name: v }))
      const data = (res as any)?.data ?? res ?? null
      if (data) {
        setPlaces((ps) => [...ps, { id: data.id || data._id, name: data.name }])
        setSelectedRoom(v)
        setNewRoom('')
      }
    })()
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;
    const place = places.find((p) => p.name === selectedRoom);
    if (!place) return;
    const res = await safeRequest(() => api.delete(`/organizer/places/${place.id}`))
    if (res !== undefined) {
      setPlaces((ps) => ps.filter((p) => p.id !== place.id))
      setSelectedRoom(places.length > 0 ? places[0]?.name : undefined)
    }
  }

  const handleOpenDialog = () => {
    // Initialize form with current date/time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      title: "",
      description: "",
      startDate: now.toISOString().split('T')[0],
      startTime: "09:00",
      endDate: tomorrow.toISOString().split('T')[0],
      endTime: "17:00",
      speaker: "",
      files: [],
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      url: undefined, // In real app, upload and get URL
    }));
    
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSaveSchedule = () => {
    if (!formData.title || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      alert('Vui lòng điền đầy đủ tiêu đề và thời gian.')
      return; // Add validation error handling
    }
    if (!isEditable) return;

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    const payload: any = {
      event_id: id,
      title: formData.title,
      description: formData.description,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      place: selectedRoom,
      capacity: 50,
      speakers: formData.speaker ? [Number(formData.speaker)] : [],
    }

    ;(async () => {
      const res = await safeRequest(() => api.post('/organizer/sessions', payload))
      const data = (res as any)?.data ?? res ?? null
      if (data) {
        const newItem: CalendarItem = {
          id: String(data.id || data._id || Date.now()),
          title: data.title,
          description: data.description,
          start: data.start_time,
          end: data.end_time,
          speaker: undefined,
          room: data.place,
          files: [],
        }
        setItems(prev => [...prev, newItem])
        setIsDialogOpen(false)
      }
    })()
  };

  const canAddItem = !!selectedRoom && isEditable;

  const headerDateStr = today.toLocaleDateString("vi-VN", { day: "2-digit", month: "long", year: "numeric" });
  const weekRangeStr = `${weekDays[0].toLocaleDateString('vi-VN',{day: '2-digit', month: 'short'})} - ${weekDays[6].toLocaleDateString('vi-VN',{day: '2-digit', month: 'short'})}`;

  return (
    <ConferenceLayout sidebarTitle="Hội nghị Công nghệ Số Việt Nam 2025">
      <div className="px-6 py-6">
        <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={goPrevWeek} className="p-2 rounded hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-lg font-medium">{weekRangeStr}</div>
            <button onClick={goNextWeek} className="p-2 rounded hover:bg-gray-100">
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="ml-3 text-sm text-muted-foreground">Hôm nay | {headerDateStr}</div>
          </div>
            <div className="flex items-center gap-2">
            <Select value={selectedRoom} onValueChange={(v) => setSelectedRoom(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chọn phòng" />
              </SelectTrigger>
              <SelectContent>
                {places.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Thêm phòng..." className="w-40" />
            <Button variant="secondary" onClick={handleAddRoom} disabled={!isEditable}>
              Thêm mới
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoom} disabled={!isEditable || !selectedRoom}>
              Xóa phòng
            </Button>
            <Button disabled={!canAddItem} onClick={handleOpenDialog}>
              Thêm lịch
            </Button>
          </div>
        </div>

        {/* Calendar area - fits screen height with internal scroll for hours */}
        <div className="rounded-2xl border bg-white">
          <div className="grid grid-cols-[64px,1fr]">
            {/* Time column header spacer + days header */}
            <div />
            <div className="grid grid-cols-7 border-b">
              {weekDays.map((d, i) => {
                const { dayOfWeek, dateStr } = formatDateLabel(d);
                const isTodayCol = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
                return (
                  <div key={i} className={`px-4 py-3 items-center flex-col ${isTodayCol ? 'bg-gray-50' : ''}`}>
                    <div className="text-l font-medium align-center font-heading self-center">{dayOfWeek}</div>
                    <div className="text-xs text-muted-foreground align-center self-center">{dateStr}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-[64px,1fr]" style={{ height: "calc(100vh - 240px)" }}>
            {/* Time column */}
            <ScrollArea ref={timeScrollRef} className="h-full border-r">
              <div style={{ height: HOUR_HEIGHT * 24 }} className="relative">
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} className="absolute left-0 right-0" style={{ top: h * HOUR_HEIGHT }}>
                    <div className="h-px bg-border" />
                    <div className="text-xs text-black mt-[-10px] pl-2 bg-white font-heading text-bold">{`${String(h).padStart(2, "0")}:00`}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Days grid */}
            <ScrollArea ref={daysScrollRef} className="h-full">
              <div className="grid grid-cols-7 relative" style={{ height: HOUR_HEIGHT * 24 }}>
                {weekDays.map((day, dayIdx) => (
                  <div key={dayIdx} className={`relative border-l ${day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth() && day.getDate() === today.getDate() ? 'bg-gray-50' : ''}`}>
                    {/* hour lines */}
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="absolute left-0 right-0 h-px bg-border/50" style={{ top: h * HOUR_HEIGHT }} />
                    ))}

                    {/* event time-frame overlay (green, low opacity) */}
                    {event && event.start_time && event.end_time && (() => {
                      try {
                        const evStart = new Date(event.start_time);
                        const evEnd = new Date(event.end_time);
                        const dayStart = new Date(day);
                        dayStart.setHours(0,0,0,0);
                        const dayEnd = new Date(day);
                        dayEnd.setHours(23,59,59,999);
                        const frameStart = evStart > dayStart ? evStart : dayStart;
                        const frameEnd = evEnd < dayEnd ? evEnd : dayEnd;
                        if (frameStart < frameEnd) {
                          const top = (minutesSinceMidnight(frameStart) / 60) * HOUR_HEIGHT;
                          const height = ((frameEnd.getTime() - frameStart.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT;
                          return (
                            <div className="absolute left-0 right-0 rounded" style={{ top, height, backgroundColor: 'rgba(16,185,129,0.1)', pointerEvents: 'none' }} />
                          )
                        }
                      } catch (err) {
                        return null;
                      }
                      return null;
                    })()}

                    {/* events */}
                    <div className="relative h-full px-2">
                      {itemsByDay[dayIdx].map((it) => {
                        const s = new Date(it.start);
                        const e = new Date(it.end);
                        const top = (minutesSinceMidnight(s) / 60) * HOUR_HEIGHT;
                        const height = ((e.getTime() - s.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT;
                        const color = getColorForKey(it.id + it.title + it.room);
                        return (
                          <div
                            key={it.id}
                            className="absolute left-2 right-2 rounded-xl shadow-sm text-white"
                            style={{ top, height, backgroundColor: color }}
                          >
                            <div className="p-3 space-y-2 text-sm">
                              <div className="flex justify-between items-start">
                                <div className="font-medium leading-tight line-clamp-2">{it.title}</div>
                                {isEditable && (
                                  <button
                                    className="ml-2 text-xs bg-black/20 rounded px-2 py-1"
                                    onClick={async () => {
                                      // delete session
                                      const ok = await safeRequest(() => api.delete(`/organizer/sessions/${it.id}`));
                                      if (ok !== undefined) setItems(prev => prev.filter(i => i.id !== it.id));
                                    }}
                                  >Xóa</button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs opacity-90">
                                <Avatar className="h-6 w-6 ring-2 ring-white/50">
                                  {it.speaker?.avatarUrl ? (
                                    <AvatarImage src={it.speaker.avatarUrl} alt={it.speaker.name} />
                                  ) : (
                                    <AvatarFallback className="bg-black/20 text-white">{getInitials(it.speaker?.name)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <span>
                                  {s.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} -
                                  {" "}
                                  {e.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thêm phiên hội nghị</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Tiêu đề phiên hội nghị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tiêu đề phiên hội nghị"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả phiên hội nghị</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả phiên hội nghị"
                rows={4}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>
                Thời gian <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-xs text-muted-foreground">Từ</Label>
                  <div className="flex gap-2">
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-xs text-muted-foreground">Đến</Label>
                  <div className="flex gap-2">
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="flex-1"
                    />
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Speaker */}
            <div className="space-y-2">
              <Label htmlFor="speaker">Diễn giả trong phiên hội nghị</Label>
              <Select value={String(formData.speaker)} onValueChange={(value) => setFormData(prev => ({ ...prev, speaker: value }))}>
                <SelectTrigger id="speaker">
                  <SelectValue placeholder="Chọn diễn giả" />
                </SelectTrigger>
                <SelectContent>
                  {speakers.map((speaker) => (
                    <SelectItem key={speaker.id} value={String(speaker.id)}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {speaker.photo_url ? (
                            <AvatarImage src={speaker.photo_url} alt={speaker.full_name} />
                          ) : (
                            <AvatarFallback className="bg-black/20 text-white">{getInitials(speaker.full_name)}</AvatarFallback>
                          )}
                        </Avatar>
                        <span>{speaker.full_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Files */}
            <div className="space-y-2">
              <Label>Tài liệu cho phiên hội nghị</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm"
                  >
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="fileUpload"
                  onChange={handleFileUpload}
                  multiple
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('fileUpload')?.click()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm tài liệu
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="destructive" onClick={() => setIsDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveSchedule}>
              Lưu thông tin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ConferenceLayout>
  );
};

export default SessionSchedule;


