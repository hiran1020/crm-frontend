import { z } from 'zod'
import { MOCK_OWNERS } from '@/constants/auth'

export const leadFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  company: z.string().trim().min(1, 'Company is required'),
  email: z.email('Enter a valid email address'),
  phone: z.string().trim().optional().default(''),
  source: z.enum([
    'Website',
    'Referral',
    'Trade Show',
    'Cold Call',
    'Email Campaign',
    'Social Media',
    'Partner',
  ]),
  value: z
    .number({ invalid_type_error: 'Value must be a number' })
    .positive('Value must be greater than 0'),
  owner: z.enum(MOCK_OWNERS, { message: 'Select an owner' }),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost', 'Converted']),
  notes: z.string().trim().optional().default(''),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>
