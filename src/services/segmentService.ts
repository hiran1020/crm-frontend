import { delay } from '@/lib/delay'
import { segmentStore } from '@/mock/segmentStore'
import type { Customer } from '@/types/customer'
import type { Lead } from '@/types/lead'
import type { Segment } from '@/types/segment'

export const segmentService = {
  async getSegments(): Promise<Segment[]> {
    await delay(300)
    return segmentStore.getAll()
  },

  async getSegment(id: string): Promise<Segment> {
    await delay(200)
    const segment = segmentStore.getById(id)
    if (!segment) throw new Error(`Segment ${id} not found`)
    return segment
  },

  async createSegment(input: Omit<Segment, 'id' | 'createdAt'>): Promise<Segment> {
    await delay(400)
    return segmentStore.create(input)
  },

  async updateSegment(id: string, input: Partial<Omit<Segment, 'id' | 'createdAt'>>): Promise<Segment> {
    await delay(400)
    return segmentStore.update(id, input)
  },

  async deleteSegment(id: string): Promise<void> {
    await delay(300)
    segmentStore.remove(id)
  },

  async previewSegment(segmentId: string, records: (Customer | Lead)[]): Promise<number> {
    await delay(100)
    const segment = segmentStore.getById(segmentId)
    if (!segment) return 0
    return segmentStore.applySegment(segment, records).length
  },

  previewSegmentSync(segment: Segment, records: (Customer | Lead)[]): number {
    return segmentStore.applySegment(segment, records).length
  },
}
