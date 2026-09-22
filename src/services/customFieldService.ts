import { api } from '@/lib/api'
import type { CustomField } from '@/types/customField'

interface ApiCustomField {
  id: string
  name?: string
  key?: string
  type?: string
  entityType?: string
  required?: boolean
  options?: string[]
  createdAt?: string
}

function fromApi(d: ApiCustomField): CustomField {
  return {
    id: d.id,
    name: d.name ?? '',
    key: d.key ?? '',
    type: (d.type as CustomField['type']) ?? 'text',
    entityType: (d.entityType as CustomField['entityType']) ?? 'customer',
    required: d.required ?? false,
    options: d.options,
    createdAt: d.createdAt ?? new Date().toISOString(),
  }
}

export const customFieldService = {
  async getCustomFields(entityType?: CustomField['entityType']): Promise<CustomField[]> {
    const qs = entityType
      ? `?entityType=${entityType}&pageSize=200`
      : '?pageSize=200'
    const res = await api.get<{ data: ApiCustomField[] }>(`/custom-fields${qs}`)
    return res.data.map(fromApi)
  },

  async getCustomField(id: string): Promise<CustomField> {
    const d = await api.get<ApiCustomField>(`/custom-fields/${id}`)
    return fromApi(d)
  },

  async createCustomField(
    input: Omit<CustomField, 'id' | 'createdAt'>,
  ): Promise<CustomField> {
    const d = await api.post<ApiCustomField>('/custom-fields', input)
    return fromApi(d)
  },

  async updateCustomField(
    id: string,
    input: Partial<Omit<CustomField, 'id' | 'createdAt'>>,
  ): Promise<CustomField> {
    const d = await api.patch<ApiCustomField>(`/custom-fields/${id}`, input)
    return fromApi(d)
  },

  async deleteCustomField(id: string): Promise<void> {
    await api.delete(`/custom-fields/${id}`)
  },
}
