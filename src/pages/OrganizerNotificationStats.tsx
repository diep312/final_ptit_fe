import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  Eye,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { organizerNotificationApi } from "@/lib/organizerNotificationApi";
import { useToast } from "@/hooks/use-toast";
import { NotificationStats } from "@/types/notifications";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function OrganizerNotificationStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<NotificationStats | null>(null);

  useEffect(() => {
    if (id) {
      loadStats();
    }
  }, [id]);

  const loadStats = async () => {
    try {
      const data = await organizerNotificationApi.getStats(id!);
      setStats(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tải thống kê",
      });
      navigate("/notifications");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">Đang tải...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return null;
  }

  const deliveryRate =
    stats.total_sent > 0
      ? ((stats.successfully_sent / stats.total_sent) * 100).toFixed(1)
      : "0.0";

  const openRate =
    stats.successfully_sent > 0
      ? ((stats.opened / stats.successfully_sent) * 100).toFixed(1)
      : "0.0";

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/notifications")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Thống kê thông báo</h1>
            <p className="text-muted-foreground">ID: {id}</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số gửi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_sent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Gửi thành công
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.successfully_sent}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {deliveryRate}% tỷ lệ gửi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã mở</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.opened}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {openRate}% tỷ lệ mở
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Thất bại</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.failed}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Progress */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tiến trình gửi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gửi thành công</span>
                <span className="font-medium">
                  {stats.successfully_sent} / {stats.total_sent}
                </span>
              </div>
              <Progress
                value={
                  stats.total_sent > 0
                    ? (stats.successfully_sent / stats.total_sent) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tỷ lệ mở</span>
                <span className="font-medium">
                  {stats.opened} / {stats.successfully_sent}
                </span>
              </div>
              <Progress
                value={
                  stats.successfully_sent > 0
                    ? (stats.opened / stats.successfully_sent) * 100
                    : 0
                }
                className="h-2"
              />
            </div>

            {stats.failed > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Thất bại</span>
                  <span className="font-medium text-red-600">
                    {stats.failed} / {stats.total_sent}
                  </span>
                </div>
                <Progress
                  value={
                    stats.total_sent > 0
                      ? (stats.failed / stats.total_sent) * 100
                      : 0
                  }
                  className="h-2 [&>div]:bg-red-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Tổng số gửi</span>
                <Badge variant="secondary">{stats.total_sent}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Gửi thành công</span>
                <Badge className="bg-green-600">
                  {stats.successfully_sent}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Đã mở</span>
                <Badge className="bg-blue-600">{stats.opened}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Thất bại</span>
                <Badge variant="destructive">{stats.failed}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">
                  Tỷ lệ gửi thành công
                </span>
                <span className="font-semibold">{deliveryRate}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Tỷ lệ mở</span>
                <span className="font-semibold">{openRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
