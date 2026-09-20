export type OnboardingStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  status: OnboardingStepStatus
  assignedTo?: string
  dueDate?: string
  completedAt?: string
  order: number
}

export interface OnboardingPlan {
  id: string
  customerId: string
  templateName: string
  status: 'active' | 'completed' | 'paused'
  steps: OnboardingStep[]
  startedAt: string
  targetCompletionDate: string
  completedAt?: string
}
