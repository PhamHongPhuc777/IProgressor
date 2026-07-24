import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/native-select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError } from '@/lib/api/client'
import { submitAccessRequest } from '../api/access-requests'
import { getPublicDepartments } from '../api/departments'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.email('Enter a valid email'),
  departmentId: z.string().min(1, 'Select your department'),
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

  const departments = useQuery({
    queryKey: ['departments', 'public'],
    queryFn: getPublicDepartments,
    staleTime: 5 * 60 * 1000,
  })

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
            <NativeSelect
              id="departmentId"
              defaultValue=""
              aria-invalid={!!errors.departmentId}
              disabled={departments.isPending || departments.isError}
              {...register('departmentId')}
            >
              <option value="" disabled>
                {departments.isPending
                  ? 'Loading departments…'
                  : departments.isError
                    ? 'Could not load departments'
                    : 'Select your department'}
              </option>
              {departments.data?.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </NativeSelect>
            {departments.isError && (
              <p className="text-xs text-destructive">
                Couldn’t load departments.{' '}
                <button
                  type="button"
                  onClick={() => departments.refetch()}
                  className="underline"
                >
                  Retry
                </button>
              </p>
            )}
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
