import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useApi } from '@/hooks/use-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  id?: string | null
  role?: 'admin' | 'organizer' | 'user'
}

const FieldRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-4">
    <div className="w-36 text-sm text-muted-foreground">{label}</div>
    <div className="flex-1 text-sm">{value ?? '-'}</div>
  </div>
)

export const AdminUserView: React.FC<Props> = ({ open, onOpenChange, id, role = 'organizer' }) => {
  const { api, safeRequest } = useApi()
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<any>(null)

  React.useEffect(() => {
    if (!open || !id) return
    void (async () => {
      setLoading(true)
      await safeRequest(async () => {
        const path =
          role === 'admin'
            ? `/admin/users/${id}`
            : role === 'user'
              ? `/admin/registration-users/${id}`
              : `/admin/organizers/${id}`
        const res = await api.get(path) as any
        const payload = res?.data ?? res
        setData(payload)
      })
      setLoading(false)
    })()
  }, [open, id, role, api, safeRequest])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chi tiết người dùng</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading ? (
            <div className="text-center py-6">Đang tải...</div>
          ) : (
            <div className="space-y-3">
              {data?.avatar && (
                <div className="pt-2">
                  <img src={data.avatar} alt="avatar" className="w-24 h-24 object-cover rounded mb-4" />
                </div>
              )}
              <FieldRow label="Tên" value={data?.name ?? data?.full_name ?? data?.fullName ?? '-'} />
              <FieldRow label="Email" value={data?.email ?? '-'} />
              <FieldRow label="Số điện thoại" value={data?.phone ?? '-'} />
              <FieldRow label="Vai trò" value={role} />
              <FieldRow label="Trạng thái" value={data?.is_active === false ? 'Vô hiệu' : 'Hoạt động'} />
              {data?.created_at && <FieldRow label="Tạo lúc" value={new Date(data.created_at).toLocaleString()} />}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Đóng</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AdminUserView
