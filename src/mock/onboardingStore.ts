import type { OnboardingPlan, OnboardingStep, OnboardingStepStatus } from '@/types/onboarding'

const STORAGE_KEY = 'crm_onboarding_v1'

function makeSteps(overrides: Partial<OnboardingStep>[] = []): OnboardingStep[] {
  const defaults: OnboardingStep[] = [
    {
      id: 'step-1',
      title: 'Welcome call scheduled',
      description: 'Schedule and conduct the initial intro call with the customer.',
      status: 'pending',
      order: 1,
    },
    {
      id: 'step-2',
      title: 'Account setup complete',
      description: 'Send credentials, confirm access, and verify account configuration.',
      status: 'pending',
      order: 2,
    },
    {
      id: 'step-3',
      title: 'Integration configured',
      description: 'Set up API keys, webhooks, and third-party integrations.',
      status: 'pending',
      order: 3,
    },
    {
      id: 'step-4',
      title: 'Team training completed',
      description: 'Conduct product walkthrough and training sessions for the customer team.',
      status: 'pending',
      order: 4,
    },
    {
      id: 'step-5',
      title: 'Go-live confirmed',
      description: 'Customer is live and operational on the platform.',
      status: 'pending',
      order: 5,
    },
  ]
  return defaults.map((step, i) => ({ ...step, ...(overrides[i] ?? {}) }))
}

const seed: OnboardingPlan[] = [
  {
    id: 'OB-001',
    customerId: 'CUS-001',
    templateName: 'Standard Onboarding',
    status: 'active',
    steps: makeSteps([
      { status: 'completed', completedAt: '2026-09-02' },
      { status: 'completed', completedAt: '2026-09-05' },
      { status: 'in_progress' },
      { status: 'pending' },
      { status: 'pending' },
    ]),
    startedAt: '2026-09-01',
    targetCompletionDate: '2026-09-30',
  },
  {
    id: 'OB-002',
    customerId: 'CUS-003',
    templateName: 'Standard Onboarding',
    status: 'active',
    steps: makeSteps([
      { status: 'completed', completedAt: '2026-08-10' },
      { status: 'pending' },
      { status: 'pending' },
      { status: 'pending' },
      { status: 'pending' },
    ]),
    startedAt: '2026-08-08',
    targetCompletionDate: '2026-09-15',
  },
]

function loadDb(): OnboardingPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as OnboardingPlan[]) : structuredClone(seed)
  } catch {
    return structuredClone(seed)
  }
}

function saveDb(data: OnboardingPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota */
  }
}

let plansDb: OnboardingPlan[] = loadDb()
let nextId = Math.max(0, ...plansDb.map((p) => parseInt(p.id.replace('OB-', ''), 10) || 0)) + 1

export const onboardingStore = {
  getByCustomer(customerId: string): OnboardingPlan | undefined {
    return plansDb.find((p) => p.customerId === customerId)
  },

  create(customerId: string): OnboardingPlan {
    const plan: OnboardingPlan = {
      id: `OB-${String(nextId).padStart(3, '0')}`,
      customerId,
      templateName: 'Standard Onboarding',
      status: 'active',
      steps: makeSteps(),
      startedAt: new Date().toISOString().slice(0, 10),
      targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    }
    nextId += 1
    plansDb = [plan, ...plansDb]
    saveDb(plansDb)
    return plan
  },

  updateStep(
    planId: string,
    stepId: string,
    status: OnboardingStepStatus,
  ): OnboardingPlan {
    const index = plansDb.findIndex((p) => p.id === planId)
    if (index === -1) throw new Error(`OnboardingPlan ${planId} not found`)
    const plan = plansDb[index]
    const steps = plan.steps.map((s) => {
      if (s.id !== stepId) return s
      return {
        ...s,
        status,
        completedAt: status === 'completed' ? new Date().toISOString().slice(0, 10) : s.completedAt,
      }
    })
    const allDone = steps.every((s) => s.status === 'completed' || s.status === 'skipped')
    const updated: OnboardingPlan = {
      ...plan,
      steps,
      status: allDone ? 'completed' : plan.status,
      completedAt: allDone ? new Date().toISOString().slice(0, 10) : plan.completedAt,
    }
    plansDb = [
      ...plansDb.slice(0, index),
      updated,
      ...plansDb.slice(index + 1),
    ]
    saveDb(plansDb)
    return updated
  },

  remove(planId: string): void {
    plansDb = plansDb.filter((p) => p.id !== planId)
    saveDb(plansDb)
  },
}
