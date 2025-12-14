import { AdminLayout } from "@/components/layout/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Plus, FileJson } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useApi } from "@/hooks/use-api";
import { permissionApi } from "@/lib/rbacApi";
import type { Permission, CreatePermissionRequest } from "@/types/rbac";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Textarea } from "@/components/ui/textarea";

interface PermissionFormData {
  code: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

const AdminPermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const { safeRequest } = useApi();

  // Modals
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState<Permission | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Permission | null>(null);
  const [openBulkCreate, setOpenBulkCreate] = useState(false);

  // Form state
  const [formData, setFormData] = useState<PermissionFormData>({
    code: "",
    name: "",
    description: "",
    resource: "",
    action: "",
  });

  const [bulkJson, setBulkJson] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceFilter, setResourceFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");

  const loadPermissions = async () => {
    await safeRequest(async () => {
      const response = await permissionApi.list({ limit: 1000 });
      setPermissions(response.items || []);
    });
  };

  const loadMetadata = async () => {
    await safeRequest(async () => {
      const [resourcesData, actionsData] = await Promise.all([
        permissionApi.getResources(),
        permissionApi.getActions(),
      ]);
      setResources(resourcesData);
      setActions(actionsData);
    });
  };

  useEffect(() => {
    void loadPermissions();
    void loadMetadata();
  }, []);

  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    let filtered = permissions;

    // Apply search filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code.toLowerCase().includes(lower) ||
          p.name.toLowerCase().includes(lower) ||
          p.resource.toLowerCase().includes(lower) ||
          p.action.toLowerCase().includes(lower) ||
          p.description?.toLowerCase().includes(lower)
      );
    }

    // Apply resource filter
    if (resourceFilter !== "ALL") {
      filtered = filtered.filter((p) => p.resource === resourceFilter);
    }

    // Apply action filter
    if (actionFilter !== "ALL") {
      filtered = filtered.filter((p) => p.action === actionFilter);
    }

    // Group by resource
    const groups: Record<string, Permission[]> = {};
    filtered.forEach((p) => {
      const resource = p.resource || "OTHER";
      if (!groups[resource]) groups[resource] = [];
      groups[resource].push(p);
    });

    return groups;
  }, [permissions, searchTerm, resourceFilter, actionFilter]);

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      resource: "",
      action: "",
    });
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (permission: Permission) => {
    setFormData({
      code: permission.code,
      name: permission.name,
      description: permission.description || "",
      resource: permission.resource,
      action: permission.action,
    });
    setEditing(permission);
  };

  const handleSave = async () => {
    await safeRequest(async () => {
      if (editing) {
        await permissionApi.update(editing._id, {
          name: formData.name,
          description: formData.description,
          resource: formData.resource,
          action: formData.action,
        });
        toast.success("Cập nhật quyền thành công");
      } else {
        await permissionApi.create(formData);
        toast.success("Tạo quyền thành công");
      }
      setOpenCreate(false);
      setEditing(null);
      resetForm();
      await loadPermissions();
      await loadMetadata();
    });
  };

  const handleDelete = async (permission: Permission) => {
    setDeleteConfirm(permission);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await safeRequest(async () => {
      await permissionApi.delete(deleteConfirm._id);
      toast.success("Xóa quyền thành công");
      setDeleteConfirm(null);
      await loadPermissions();
    });
  };

  const handleBulkCreate = async () => {
    await safeRequest(async () => {
      const permissionsData: CreatePermissionRequest[] = JSON.parse(bulkJson);
      await permissionApi.bulkCreate(permissionsData);
      toast.success(`Tạo ${permissionsData.length} quyền thành công`);
      setOpenBulkCreate(false);
      setBulkJson("");
      await loadPermissions();
      await loadMetadata();
    });
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-700",
      READ: "bg-blue-100 text-blue-700",
      UPDATE: "bg-yellow-100 text-yellow-700",
      DELETE: "bg-red-100 text-red-700",
      MANAGE: "bg-purple-100 text-purple-700",
      VIEW: "bg-cyan-100 text-cyan-700",
      EXECUTE: "bg-orange-100 text-orange-700",
    };
    const colorClass = colors[action] || "bg-gray-100 text-gray-700";
    return <Badge className={colorClass}>{action}</Badge>;
  };

  const exampleBulkJson = `[
  {
    "code": "EVENT:CREATE",
    "name": "Tạo sự kiện",
    "description": "Cho phép tạo sự kiện mới",
    "resource": "EVENT",
    "action": "CREATE"
  },
  {
    "code": "EVENT:READ",
    "name": "Xem sự kiện",
    "description": "Cho phép xem thông tin sự kiện",
    "resource": "EVENT",
    "action": "READ"
  }
]`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm quyền..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả Resource</SelectItem>
                {resources.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả Action</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenBulkCreate(true)}>
              <FileJson className="w-4 h-4 mr-2" />
              TẠO HÀNG LOẠT
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleCreate}
            >
              <Plus className="w-4 h-4 mr-2" />
              TẠO QUYỀN
            </Button>
          </div>
        </div>

        {/* Grouped Permissions */}
        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <AccordionItem key={resource} value={resource}>
                <AccordionTrigger className="px-6 py-4 text-left hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{resource}</span>
                    <Badge variant="secondary">
                      {(perms as Permission[]).length} quyền
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-4">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2 text-left text-sm font-semibold text-muted-foreground">
                            MÃ
                          </th>
                          <th className="py-2 text-left text-sm font-semibold text-muted-foreground">
                            TÊN
                          </th>
                          <th className="py-2 text-left text-sm font-semibold text-muted-foreground">
                            MÔ TẢ
                          </th>
                          <th className="py-2 text-left text-sm font-semibold text-muted-foreground">
                            ACTION
                          </th>
                          <th className="py-2 text-left text-sm font-semibold text-muted-foreground">
                            HÀNH ĐỘNG
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(perms as Permission[]).map((permission) => (
                          <tr
                            key={permission._id}
                            className="border-b hover:bg-muted/30"
                          >
                            <td className="py-3 text-sm font-mono text-muted-foreground">
                              {permission.code}
                            </td>
                            <td className="py-3 text-sm font-medium">
                              {permission.name}
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">
                              {permission.description || "-"}
                            </td>
                            <td className="py-3">
                              {getActionBadge(permission.action)}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(permission)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(permission)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {Object.keys(groupedPermissions).length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground">
              Không tìm thấy quyền nào
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openCreate || !!editing}
        onOpenChange={(open) => {
          if (!open) {
            setOpenCreate(false);
            setEditing(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Chỉnh sửa quyền" : "Tạo quyền mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Mã quyền *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="VD: EVENT:CREATE"
                disabled={!!editing}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Định dạng: RESOURCE:ACTION
              </p>
            </div>
            <div>
              <Label htmlFor="name">Tên quyền *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Tạo sự kiện"
              />
            </div>
            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mô tả quyền"
              />
            </div>
            <div>
              <Label htmlFor="resource">Resource *</Label>
              <Select
                value={formData.resource}
                onValueChange={(value) =>
                  setFormData({ ...formData, resource: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn resource" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM">Nhập custom...</SelectItem>
                </SelectContent>
              </Select>
              {formData.resource === "CUSTOM" && (
                <Input
                  className="mt-2"
                  value={
                    formData.resource === "CUSTOM" ? "" : formData.resource
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resource: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Nhập tên resource"
                />
              )}
            </div>
            <div>
              <Label htmlFor="action">Action *</Label>
              <Select
                value={formData.action}
                onValueChange={(value) =>
                  setFormData({ ...formData, action: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="READ">READ</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="MANAGE">MANAGE</SelectItem>
                  <SelectItem value="VIEW">VIEW</SelectItem>
                  <SelectItem value="EXECUTE">EXECUTE</SelectItem>
                  <SelectItem value="CUSTOM">Nhập custom...</SelectItem>
                </SelectContent>
              </Select>
              {formData.action === "CUSTOM" && (
                <Input
                  className="mt-2"
                  value={formData.action === "CUSTOM" ? "" : formData.action}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      action: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="Nhập tên action"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCreate(false);
                setEditing(null);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSave}>
              {editing ? "Cập nhật" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={openBulkCreate} onOpenChange={setOpenBulkCreate}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Tạo quyền hàng loạt</DialogTitle>
            <DialogDescription>
              Nhập JSON array chứa danh sách quyền cần tạo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-json">JSON Data</Label>
              <Textarea
                id="bulk-json"
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder={exampleBulkJson}
                className="font-mono text-sm min-h-[300px]"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold mb-1">Ví dụ:</p>
              <pre className="bg-muted p-2 rounded overflow-x-auto">
                {exampleBulkJson}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenBulkCreate(false)}>
              Hủy
            </Button>
            <Button onClick={handleBulkCreate} disabled={!bulkJson.trim()}>
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa quyền</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa quyền{" "}
              <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.code})?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPermissions;
