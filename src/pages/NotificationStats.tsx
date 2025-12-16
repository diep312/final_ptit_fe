import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Eye, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "@/hooks/use-api";
import { notificationApi } from "@/lib/notificationApi";
import type { NotificationStats } from "@/types/notifications";
import { format } from "date-fns";

const NotificationStatsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { safeRequest } = useApi();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  useEffect(() => {
    if (id) {
      loadStats();
    }
  }, [id]);

  const loadStats = async () => {
    if (!id) return;

    setLoading(true);
    await safeRequest(async () => {
      const data = await notificationApi.getStats(id);
      setStats(data);
    });
    setLoading(false);
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

  if (!stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Không tìm thấy thống kê</p>
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
            <h1 className="text-3xl font-bold">Thống kê thông báo</h1>
            <p className="text-muted-foreground mt-1">{stats.title}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng người nhận
              </CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_recipients}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã gửi</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.delivery_rate.toFixed(2)}% thành công
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã nhận</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_delivered}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_sent > 0
                  ? ((stats.total_delivered / stats.total_sent) * 100).toFixed(
                      2
                    )
                  : 0}
                % đã nhận
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã mở</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_opened}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.open_rate.toFixed(2)}% đã xem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_failed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_recipients > 0
                  ? (
                      (stats.total_failed / stats.total_recipients) *
                      100
                    ).toFixed(2)
                  : 0}
                % lỗi
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <p className="font-medium capitalize">{stats.status}</p>
              </div>
              {stats.sent_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian gửi</p>
                  <p className="font-medium">
                    {format(new Date(stats.sent_at), "dd/MM/yyyy HH:mm:ss")}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2">Tỷ lệ chuyển đổi</h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tỷ lệ gửi thành công</span>
                    <span>{stats.delivery_rate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${stats.delivery_rate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tỷ lệ mở thông báo</span>
                    <span>{stats.open_rate.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${stats.open_rate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default NotificationStatsPage;
