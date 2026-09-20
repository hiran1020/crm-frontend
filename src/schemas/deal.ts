import { z } from 'zod'
import { MOCK_OWNERS } from '@/constants/auth'

export const dealFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  customerId: z.string().trim().min(1, 'Customer is required'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  stage: z.enum(['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  owner: z.enum(MOCK_OWNERS, { message: 'Select an owner' }),
  expectedCloseDate: z.string().trim().min(1, 'Expected close date is required'),
  description: z.string().trim().optional().default(''),
  probability: z.number().min(0).max(100).optional(),
})

export type DealFormValues = z.infer<typeof dealFormSchema>
