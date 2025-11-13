import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { useApi } from '@/hooks/use-api'

type Role = 'admin' | 'organizer'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: any
  role?: Role
  onSaved?: (saved: any) => void
}

export const AdminUserForm: React.FC<Props> = ({ open, onOpenChange, initial, role = 'organizer', onSaved }) => {
  const { api, safeRequest } = useApi()
  const isEdit = !!initial

  const methods = useForm({ defaultValues: initial || { name: '', email: '', phone: '', password: '' } })
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = methods

  React.useEffect(() => {
    reset(initial || { name: '', email: '', phone: '', password: '' })
  }, [initial, reset])

  const onSubmit = async (values: any) => {
    await safeRequest(async () => {
      if (isEdit) {
        if (role === 'admin') {
          await api.put(`/admin/users/${initial._id}`, values)
        } else {
          await api.put(`/admin/organizers/${initial._id}`, values)
        }
      } else {
        if (role === 'admin') {
          await api.post('/admin/auth/register', values)
        } else {
          await api.post('/admin/organizers', values)
        }
      }

      onSaved && onSaved(values)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Chỉnh sửa ${role === 'admin' ? 'Admin' : 'Tổ chức'}` : `Tạo ${role === 'admin' ? 'Admin' : 'Tổ chức'}`}</DialogTitle>
        </DialogHeader>

        <Form {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Tên</FormLabel>
              <FormControl>
                <Input {...register('name', { required: 'Tên là bắt buộc' })} />
              </FormControl>
              <FormMessage>{errors.name?.message as any}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...register('email', { required: 'Email là bắt buộc', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' } })} />
              </FormControl>
              <FormMessage>{errors.email?.message as any}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input {...register('phone')} />
              </FormControl>
              <FormMessage>{errors.phone?.message as any}</FormMessage>
            </FormItem>

            {!isEdit && (
              <FormItem>
                <FormLabel>Mật khẩu</FormLabel>
                <FormControl>
                  <Input type="password" {...register('password', { required: 'Mật khẩu là bắt buộc', minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' } })} />
                </FormControl>
                <FormMessage>{errors.password?.message as any}</FormMessage>
              </FormItem>
            )}

            <DialogFooter>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>{isEdit ? 'Lưu' : 'Tạo'}</Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AdminUserForm
