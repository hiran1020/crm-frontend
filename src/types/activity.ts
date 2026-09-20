export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task'
export type ActivityPriority = 'low' | 'medium' | 'high'

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description?: string
  relatedTo?: string
  relatedType?: 'customer' | 'lead' | 'deal'
  relatedName?: string
  owner: string
  createdAt: string
  completed: boolean
  dueDate?: string
  priority?: ActivityPriority
}

export type ActivityInput = Omit<Activity, 'id' | 'createdAt'>
