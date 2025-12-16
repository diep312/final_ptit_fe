import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Send,
  Edit,
  Trash2,
  Calendar,
  X,
  BarChart3,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useApi } from "@/hooks/use-api";
import { notificationApi } from "@/lib/notificationApi";
import type {
  Notification,
  NotificationStatus,
  NotificationScope,
} from "@/types/notifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { safeRequest } = useApi();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "ALL">(
    "ALL"
  );
  const [scopeFilter, setScopeFilter] = useState<NotificationScope | "ALL">(
    "ALL"
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<Notification | null>(null);
  const [sendConfirm, setSendConfirm] = useState<Notification | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<Notification | null>(null);

  const loadNotifications = async () => {
    await safeRequest(async () => {
      const params: any = { page, limit };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (scopeFilter !== "ALL") params.scope = scopeFilter;

      const response = await notificationApi.list(params);
      setNotifications(response.items || []);
      setTotal(response.total || 0);
    });
  };

  useEffect(() => {
    void loadNotifications();
  }, [page, statusFilter, scopeFilter]);

  const filteredNotifications = useMemo(() => {
    if (!searchTerm) return notifications;
    const lower = searchTerm.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(lower) ||
        n.body.toLowerCase().includes(lower)
    );
  }, [notifications, searchTerm]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await safeRequest(async () => {
      await notificationApi.delete(deleteConfirm.notification_id);
      toast.success("Xóa thông báo thành công");
      setDeleteConfirm(null);
      await loadNotifications();
    });
  };

  const handleSend = async () => {
    if (!sendConfirm) return;
    await safeRequest(async () => {
      const result = await notificationApi.send(sendConfirm.notification_id);
      toast.success(
        `Gửi thành công ${result.total_sent}/${result.total_recipients} thông báo`
      );
      setSendConfirm(null);
      await loadNotifications();
    });
  };

  const handleCancel = async () => {
    if (!cancelConfirm) return;
    await safeRequest(async () => {
      await notificationApi.cancel(cancelConfirm.notification_id);
      toast.success("Hủy lịch gửi thành công");
      setCancelConfirm(null);
      await loadNotifications();
    });
  };

  const getStatusBadge = (status: NotificationStatus) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      scheduled: "bg-blue-100 text-blue-700",
      sending: "bg-yellow-100 text-yellow-700",
      sent: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
    };
    const labels = {
      draft: "Bản nháp",
      scheduled: "Đã lên lịch",
      sending: "Đang gửi",
      sent: "Đã gửi",
      failed: "Thất bại",
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const getScopeBadge = (scope: NotificationScope) => {
    const colors = {
      all: "bg-purple-100 text-purple-700",
      event: "bg-blue-100 text-blue-700",
      organizer: "bg-green-100 text-green-700",
    };
    const labels = {
      all: "Toàn bộ",
      event: "Sự kiện",
      organizer: "Ban tổ chức",
    };
    return <Badge className={colors[scope]}>{labels[scope]}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quản lý thông báo</h1>
            <p className="text-muted-foreground mt-1">
              Tạo và gửi thông báo đẩy đến người dùng
            </p>
          </div>
          <Button onClick={() => navigate("/admin/notifications/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo thông báo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as NotificationStatus | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="scheduled">Đã lên lịch</SelectItem>
              <SelectItem value="sending">Đang gửi</SelectItem>
              <SelectItem value="sent">Đã gửi</SelectItem>
              <SelectItem value="failed">Thất bại</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={scopeFilter}
            onValueChange={(value) =>
              setScopeFilter(value as NotificationScope | "ALL")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả phạm vi</SelectItem>
              <SelectItem value="all">Toàn bộ</SelectItem>
              <SelectItem value="event">Sự kiện</SelectItem>
              <SelectItem value="organizer">Ban tổ chức</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notifications Table */}
        <div className="bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Tiêu đề</th>
                  <th className="text-left p-4 font-medium">Trạng thái</th>
                  <th className="text-left p-4 font-medium">Phạm vi</th>
                  <th className="text-left p-4 font-medium">Thống kê</th>
                  <th className="text-left p-4 font-medium">Thời gian</th>
                  <th className="text-right p-4 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((notification) => (
                  <tr
                    key={notification.notification_id}
                    className="border-b hover:bg-muted/50"
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {notification.body}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(notification.status)}
                    </td>
                    <td className="p-4">{getScopeBadge(notification.scope)}</td>
                    <td className="p-4">
                      <div className="text-sm space-y-1">
                        {notification.total_recipients !== undefined && (
                          <>
                            <div>
                              Gửi: {notification.total_sent || 0}/
                              {notification.total_recipients}
                            </div>
                            <div className="text-muted-foreground">
                              Mở: {notification.total_opened || 0}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm space-y-1">
                        {notification.scheduled_at && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Calendar className="w-3 h-3" />
                            {format(
                              new Date(notification.scheduled_at),
                              "dd/MM/yyyy HH:mm"
                            )}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {format(
                            new Date(notification.created_at),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {notification.status === "sent" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/admin/notifications/${notification.notification_id}/stats`
                              )
                            }
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                        )}
                        {notification.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/admin/notifications/${notification.notification_id}/edit`
                                )
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => setSendConfirm(notification)}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteConfirm(notification)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {notification.status === "scheduled" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                navigate(
                                  `/admin/notifications/${notification.notification_id}/edit`
                                )
                              }
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setCancelConfirm(notification)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(page - 1) * limit + 1} -{" "}
                {Math.min(page * limit, total)} / {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa thông báo "{deleteConfirm?.title}"? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Confirmation */}
      <AlertDialog
        open={!!sendConfirm}
        onOpenChange={(open) => !open && setSendConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gửi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn gửi thông báo "{sendConfirm?.title}"? Thông báo
              sẽ được gửi đến tất cả người dùng trong phạm vi đã chọn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Gửi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Schedule Confirmation */}
      <AlertDialog
        open={!!cancelConfirm}
        onOpenChange={(open) => !open && setCancelConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy lịch gửi</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn hủy lịch gửi thông báo "{cancelConfirm?.title}"?
              Thông báo sẽ chuyển về trạng thái bản nháp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>
              Hủy lịch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminNotifications;
