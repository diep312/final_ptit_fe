import React from 'react'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Form, FormItem, FormLabel, FormControl, FormMessage} from '@/components/ui/form'
import {useForm} from 'react-hook-form'
import {useApi} from '@/hooks/use-api'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (saved: any) => void
}

export const AdminAppUserForm: React.FC<Props> = ({open, onOpenChange, onSaved}) => {
  const {api, safeRequest} = useApi()

  const methods = useForm({defaultValues: {full_name: '', email: '', phone: '', password: ''}})
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
    reset,
  } = methods

  React.useEffect(() => {
    if (!open) reset({full_name: '', email: '', phone: '', password: ''})
  }, [open, reset])

  const onSubmit = async (values: any) => {
    await safeRequest(async () => {
      await api.post('/admin/registration-users', values)
      onSaved && onSaved(values)
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo người dùng</DialogTitle>
        </DialogHeader>

        <Form {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Họ và tên</FormLabel>
              <FormControl>
                <Input {...register('full_name', {required: 'Họ và tên là bắt buộc'})} />
              </FormControl>
              <FormMessage>{errors.full_name?.message as any}</FormMessage>
            </FormItem>

            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...register('email', {
                    required: 'Email là bắt buộc',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email không hợp lệ',
                    },
                  })}
                />
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

            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...register('password', {
                    required: 'Mật khẩu là bắt buộc',
                    minLength: {value: 6, message: 'Mật khẩu tối thiểu 6 ký tự'},
                  })}
                />
              </FormControl>
              <FormMessage>{errors.password?.message as any}</FormMessage>
            </FormItem>

            <DialogFooter>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Tạo
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AdminAppUserForm
