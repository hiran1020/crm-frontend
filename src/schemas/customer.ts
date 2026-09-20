import { z } from 'zod'
import { MOCK_OWNERS } from '@/constants/auth'

export const customerFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number looks too short')
    .regex(/^[+\d().\-\sxX]+$/, 'Enter a valid phone number'),
  company: z.string().trim().min(1, 'Company is required'),
  jobTitle: z.string().trim().min(1, 'Job title is required'),
  status: z.enum(['Active', 'Inactive']),
  owner: z.enum(MOCK_OWNERS, { message: 'Select an owner' }),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
