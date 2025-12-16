import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { notificationApi } from "@/lib/notificationApi";
import type { NotificationScope, ActionType } from "@/types/notifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const EditNotification = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { safeRequest } = useApi();

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    image_url: "",
    scope: "all" as NotificationScope,
    target_event_id: "",
    target_organizer_id: "",
    action_type: "" as ActionType,
    action_data: {},
    scheduled_at: "",
  });

  useEffect(() => {
    if (id) {
      loadNotification();
    }
  }, [id]);

  const loadNotification = async () => {
    if (!id) return;

    setLoading(true);
    await safeRequest(async () => {
      const notification = await notificationApi.getById(id);

      setFormData({
        title: notification.title,
        body: notification.body,
        image_url: notification.image_url || "",
        scope: notification.scope,
        target_event_id: notification.target_event_id || "",
        target_organizer_id: notification.target_organizer_id || "",
        action_type: notification.action_type || "",
        action_data: notification.action_data || {},
        scheduled_at: notification.scheduled_at
          ? new Date(notification.scheduled_at).toISOString().slice(0, 16)
          : "",
      });
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await safeRequest(async () => {
      const payload: any = {
        title: formData.title,
        body: formData.body,
        scope: formData.scope,
      };

      if (formData.image_url) payload.image_url = formData.image_url;
      if (formData.scope === "event" && formData.target_event_id) {
        payload.target_event_id = formData.target_event_id;
      }
      if (formData.scope === "organizer" && formData.target_organizer_id) {
        payload.target_organizer_id = formData.target_organizer_id;
      }
      if (formData.action_type) {
        payload.action_type = formData.action_type;
        payload.action_data = formData.action_data;
      }

      await notificationApi.update(id, payload);

      // Handle rescheduling separately if scheduled_at changed
      if (formData.scheduled_at) {
        await notificationApi.reschedule(id, {
          scheduled_at: new Date(formData.scheduled_at).toISOString(),
        });
      }

      toast.success("Cập nhật thông báo thành công");
      navigate("/admin/notifications");
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/notifications")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chỉnh sửa thông báo</h1>
            <p className="text-muted-foreground mt-1">
              Cập nhật thông tin thông báo
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="bg-card rounded-lg border p-6 space-y-4">
            <div>
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Nhập tiêu đề thông báo"
                required
              />
            </div>

            <div>
              <Label htmlFor="body">Nội dung *</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                placeholder="Nhập nội dung thông báo"
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="image_url">URL hình ảnh</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>

            <div>
              <Label htmlFor="scope">Phạm vi gửi *</Label>
              <Select
                value={formData.scope}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    scope: value as NotificationScope,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toàn bộ người dùng</SelectItem>
                  <SelectItem value="event">Sự kiện cụ thể</SelectItem>
                  <SelectItem value="organizer">Ban tổ chức cụ thể</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scope === "event" && (
              <div>
                <Label htmlFor="target_event_id">ID Sự kiện *</Label>
                <Input
                  id="target_event_id"
                  value={formData.target_event_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_event_id: e.target.value,
                    })
                  }
                  placeholder="Nhập ID sự kiện"
                  required
                />
              </div>
            )}

            {formData.scope === "organizer" && (
              <div>
                <Label htmlFor="target_organizer_id">ID Ban tổ chức *</Label>
                <Input
                  id="target_organizer_id"
                  value={formData.target_organizer_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      target_organizer_id: e.target.value,
                    })
                  }
                  placeholder="Nhập ID ban tổ chức"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="action_type">Loại hành động</Label>
              <Select
                value={formData.action_type || "none"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    action_type: value === "none" ? "" : (value as ActionType),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn hành động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  <SelectItem value="open_event">Mở sự kiện</SelectItem>
                  <SelectItem value="open_url">Mở URL</SelectItem>
                  <SelectItem value="open_screen">Mở màn hình</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduled_at">Lên lịch gửi</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) =>
                  setFormData({ ...formData, scheduled_at: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Thay đổi thời gian để lên lịch lại thông báo
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/notifications")}
            >
              Hủy
            </Button>
            <Button type="submit">Cập nhật</Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditNotification;
