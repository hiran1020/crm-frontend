import { z } from 'zod'

export const activityFormSchema = z
  .object({
    type: z.enum(['call', 'email', 'meeting', 'note', 'task']),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().optional(),
    owner: z.string().min(1, 'Select an owner'),
    completed: z.boolean(),
    dueDate: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  })
  .refine(
    (data) =>
      data.type !== 'task' ||
      !data.dueDate ||
      /^\d{4}-\d{2}-\d{2}$/.test(data.dueDate),
    { message: 'Enter a valid date (YYYY-MM-DD)', path: ['dueDate'] },
  )

export type ActivityFormValues = z.infer<typeof activityFormSchema>
