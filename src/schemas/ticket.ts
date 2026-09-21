import { z } from 'zod'

export const ticketFormSchema = z.object({
  title:        z.string().trim().min(1, 'Title is required').max(200),
  description:  z.string().trim().min(1, 'Description is required'),
  status:       z.enum(['Open', 'In Progress', 'Pending', 'Resolved', 'Closed']),
  priority:     z.enum(['Low', 'Medium', 'High', 'Critical']),
  category:     z.enum(['Bug', 'Feature Request', 'Billing', 'Technical Support', 'General Inquiry']),
  assignedTo:   z.string().min(1, 'Select an assignee'),
  assigneeId:   z.string().optional(),
  customerId:   z.string().optional(),
  customerName: z.string().optional(),
  createdBy:    z.string().trim().min(1, 'Reporter name is required'),
})

export type TicketFormValues = z.infer<typeof ticketFormSchema>
