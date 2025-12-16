import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, Send } from "lucide-react";
import { organizerNotificationApi } from "@/lib/organizerNotificationApi";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function CreateOrganizerNotification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    image_url: "",
    scope: "event" as "event" | "organizer",
    target_id: "",
    action_type: "none",
    action_value: "",
  });

  const handleSubmit = async (e: React.FormEvent, sendNow: boolean = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      let scheduled_at = null;
      if (!sendNow && scheduledDate && scheduledTime) {
        const [hours, minutes] = scheduledTime.split(":");
        const combinedDate = new Date(scheduledDate);
        combinedDate.setHours(parseInt(hours, 10));
        combinedDate.setMinutes(parseInt(minutes, 10));
        scheduled_at = combinedDate.toISOString();
      }

      const payload: any = {
        title: formData.title,
        body: formData.body,
        image_url: formData.image_url || undefined,
        scope: formData.scope,
        target_id: formData.target_id || undefined,
        scheduled_at,
      };

      // Only add action fields if action_type is not 'none'
      if (formData.action_type !== "none") {
        payload.action_type = formData.action_type;
        payload.action_value = formData.action_value;
      }

      const notification = await organizerNotificationApi.create(payload);

      if (sendNow) {
        await organizerNotificationApi.send(notification.notification_id);
        toast({
          title: "Thành công",
          description: "Thông báo đã được gửi",
        });
      } else {
        toast({
          title: "Thành công",
          description: scheduled_at
            ? "Thông báo đã được lên lịch"
            : "Thông báo đã được tạo",
        });
      }

      navigate("/notifications");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tạo thông báo",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/notifications")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Tạo thông báo mới</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin thông báo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  placeholder="Nhập tiêu đề thông báo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Nội dung *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) =>
                    setFormData({ ...formData, body: e.target.value })
                  }
                  required
                  placeholder="Nhập nội dung thông báo"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL hình ảnh</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scope">Phạm vi *</Label>
                  <Select
                    value={formData.scope}
                    onValueChange={(value: "event" | "organizer") =>
                      setFormData({ ...formData, scope: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event">Sự kiện</SelectItem>
                      <SelectItem value="organizer">Người tổ chức</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_id">ID đích</Label>
                  <Input
                    id="target_id"
                    value={formData.target_id}
                    onChange={(e) =>
                      setFormData({ ...formData, target_id: e.target.value })
                    }
                    placeholder="Để trống cho tất cả"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Lên lịch gửi</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !scheduledDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {scheduledDate ? (
                          format(scheduledDate, "dd/MM/yyyy")
                        ) : (
                          <span>Chọn ngày</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={scheduledDate}
                        onSelect={setScheduledDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={!scheduledDate}
                    placeholder="Chọn giờ"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Hành động (tùy chọn)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="action_type">Loại hành động</Label>
                    <Select
                      value={formData.action_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, action_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không có</SelectItem>
                        <SelectItem value="url">Mở URL</SelectItem>
                        <SelectItem value="screen">Mở màn hình</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="action_value">Giá trị hành động</Label>
                    <Input
                      id="action_value"
                      value={formData.action_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          action_value: e.target.value,
                        })
                      }
                      disabled={formData.action_type === "none"}
                      placeholder="URL hoặc tên màn hình"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/notifications")}
                  disabled={loading}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={loading}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {loading ? "Đang xử lý..." : "Lưu nháp"}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Đang gửi..." : "Gửi ngay"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
