export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'url'

export interface CustomField {
  id: string
  name: string
  key: string
  type: CustomFieldType
  entityType: 'customer' | 'lead' | 'deal'
  required: boolean
  options?: string[]
  createdAt: string
}
