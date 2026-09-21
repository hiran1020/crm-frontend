import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import type { CrmUserInput, UserStats } from '@/types/crmUser'
import { useCustomers } from '@/hooks/useCustomers'
import { useLeads } from '@/hooks/useLeads'
import { useDeals } from '@/hooks/useDeals'
import { useActivities } from '@/hooks/useActivities'

export const userKeys = {
  all: ['crmUsers'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => userService.getUsers(),
    staleTime: 10 * 60_000,
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUser(id),
    enabled: Boolean(id),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrmUserInput) => userService.createUser(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CrmUserInput }) =>
      userService.updateUser(id, input),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.toggleUserStatus(id),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all })
      await queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

export function useUserStats(userName: string): UserStats {
  const customersQuery = useCustomers({ pageSize: 500 })
  const leadsQuery = useLeads({ pageSize: 500 })
  const dealsQuery = useDeals({ pageSize: 500 })
  const activitiesQuery = useActivities()

  return useMemo<UserStats>(() => {
    const customers = customersQuery.data?.data ?? []
    const leads = leadsQuery.data?.data ?? []
    const deals = dealsQuery.data?.data ?? []
    const activities = activitiesQuery.data ?? []

    const customersOwned = customers.filter((c) => c.owner === userName).length
    const leadsOwned = leads.filter((l) => l.owner === userName).length
    const userDeals = deals.filter((d) => d.owner === userName)
    const wonDeals = userDeals.filter((d) => d.stage === 'Won')
    const openDeals = userDeals.filter(
      (d) => d.stage !== 'Won' && d.stage !== 'Lost',
    ).length
    const wonRevenue = wonDeals.reduce((s, d) => s + d.amount, 0)
    const activitiesLogged = activities.filter((a) => a.owner === userName).length

    return {
      customersOwned,
      leadsOwned,
      openDeals,
      wonDeals: wonDeals.length,
      wonRevenue,
      activitiesLogged,
    }
  }, [
    customersQuery.data,
    leadsQuery.data,
    dealsQuery.data,
    activitiesQuery.data,
    userName,
  ])
}
