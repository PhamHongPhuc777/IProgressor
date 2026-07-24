import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError } from '@/lib/api/client'
import { submitAccessRequest } from '../api/access-requests'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.email('Enter a valid email'),
  // TODO: swap for a department <Select> once the departments list is
  // reachable pre-auth (GET /departments currently requires a token).
  departmentId: z.string().min(1, 'Enter your department'),
  message: z.string().max(500, 'Keep it under 500 characters').optional(),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: submitAccessRequest,
    onSuccess: () => {
      toast.success("Request submitted — you'll get an email once it's approved.")
      navigate('/login')
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError
          ? `Could not submit request (${error.status}).`
          : 'Something went wrong. Please try again.',
      )
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request access</CardTitle>
        <CardDescription>
          Submit a request; an admin will approve it and email you an invite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register('fullName')} />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="departmentId">Department</Label>
            <Input id="departmentId" {...register('departmentId')} />
            {errors.departmentId && (
              <p className="text-xs text-destructive">
                {errors.departmentId.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Input id="message" {...register('message')} />
            {errors.message && (
              <p className="text-xs text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting…' : 'Submit request'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have access?{' '}
          <Link to="/login" className="text-foreground underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
