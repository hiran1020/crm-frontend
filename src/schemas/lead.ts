import { z } from 'zod'

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
    .number({ error: 'Value must be a number' })
    .positive('Value must be greater than 0'),
  owner: z.string().min(1, 'Select an owner'),
  ownerId: z.string().min(1, 'Select an owner'),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Lost', 'Converted']),
  notes: z.string().trim().optional().default(''),
})

export type LeadFormValues = z.infer<typeof leadFormSchema>
