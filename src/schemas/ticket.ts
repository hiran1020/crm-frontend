import { z } from 'zod'
import { MOCK_OWNERS } from '@/constants/auth'

export const ticketFormSchema = z.object({
  title:        z.string().trim().min(1, 'Title is required').max(200),
  description:  z.string().trim().min(1, 'Description is required'),
  status:       z.enum(['Open', 'In Progress', 'Pending', 'Resolved', 'Closed']),
  priority:     z.enum(['Low', 'Medium', 'High', 'Critical']),
  category:     z.enum(['Bug', 'Feature Request', 'Billing', 'Technical Support', 'General Inquiry']),
  assignedTo:   z.enum(MOCK_OWNERS, { error: 'Select an assignee' }),
  customerId:   z.string().optional(),
  customerName: z.string().optional(),
  createdBy:    z.string().trim().min(1, 'Reporter name is required'),
})

export type TicketFormValues = z.infer<typeof ticketFormSchema>
