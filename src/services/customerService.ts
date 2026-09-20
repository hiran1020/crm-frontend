import { delay } from '@/lib/delay'
import { customerStore } from '@/mock/customerStore'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
  CustomerListResult,
} from '@/types/customer'

/**
 * Customer service — UI and hooks call this, never the mock store directly.
 * Later: replace bodies with fetch('/api/customers...').
 */
export const customerService = {
  async getCustomers(
    params: CustomerListParams = {},
  ): Promise<CustomerListResult> {
    await delay(450)
    return customerStore.list(params)
  },

  async getCustomer(id: string): Promise<Customer> {
    await delay(350)
    const customer = customerStore.getById(id)
    if (!customer) {
      throw new Error('Customer not found')
    }
    return customer
  },

  async findByEmail(email: string): Promise<Customer | undefined> {
    await delay(200)
    return customerStore.findByEmail(email)
  },

  async createCustomer(input: CustomerInput): Promise<Customer> {
    await delay(500)
    return customerStore.create(input)
  },

  async updateCustomer(id: string, input: CustomerInput): Promise<Customer> {
    await delay(500)
    return customerStore.update(id, input)
  },

  async deleteCustomer(id: string): Promise<void> {
    await delay(400)
    customerStore.remove(id)
  },

  async bulkDeleteCustomers(ids: string[]): Promise<void> {
    await delay(500)
    customerStore.bulkRemove(ids)
  },

  async getOwners(): Promise<string[]> {
    await delay(200)
    return customerStore.getOwners()
  },
}
