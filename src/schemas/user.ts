import { z } from 'zod'

export const userFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.email('Valid email required'),
  role: z.enum(['admin', 'manager', 'sales_agent']),
  status: z.enum(['active', 'inactive']),
  phone: z.string().optional().default(''),
  jobTitle: z.string().optional().default(''),
  department: z.string().optional().default(''),
})

export type UserFormValues = z.infer<typeof userFormSchema>
