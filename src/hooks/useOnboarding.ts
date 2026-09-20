import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { delay } from '@/lib/delay'
import { onboardingStore } from '@/mock/onboardingStore'
import type { OnboardingStepStatus } from '@/types/onboarding'

export const onboardingKeys = {
  all: ['onboarding'] as const,
  byCustomer: (customerId: string) =>
    [...onboardingKeys.all, 'byCustomer', customerId] as const,
}

export function useOnboarding(customerId: string) {
  return useQuery({
    queryKey: onboardingKeys.byCustomer(customerId),
    queryFn: async () => {
      await delay(300)
      return onboardingStore.getByCustomer(customerId) ?? null
    },
    enabled: Boolean(customerId),
  })
}

export function useStartOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (customerId: string) => {
      await delay(400)
      return onboardingStore.create(customerId)
    },
    onSuccess: async (_data, customerId) => {
      await qc.invalidateQueries({
        queryKey: onboardingKeys.byCustomer(customerId),
      })
    },
  })
}

export function useUpdateOnboardingStep() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      planId,
      stepId,
      status,
    }: {
      planId: string
      stepId: string
      status: OnboardingStepStatus
      customerId: string
    }) => {
      await delay(300)
      return onboardingStore.updateStep(planId, stepId, status)
    },
    onSuccess: async (_data, vars) => {
      await qc.invalidateQueries({
        queryKey: onboardingKeys.byCustomer(vars.customerId),
      })
    },
  })
}
