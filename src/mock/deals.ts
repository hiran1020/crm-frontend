import type { Deal } from '@/types/deal'

export const dealsSeed: Deal[] = [
  { id: 'DEAL-001', title: 'Nova Games Enterprise License', customerId: 'CUS-001', amount: 25000, stage: 'Proposal', owner: 'Sarah Wilson', expectedCloseDate: '2026-04-15', description: 'Annual enterprise license for the Nova Games platform.', probability: 60, createdAt: '2025-10-12' },
  { id: 'DEAL-002', title: 'GreenLeaf Annual Wellness Plan', customerId: 'CUS-002', amount: 8000, stage: 'Qualified', owner: 'David Chen', expectedCloseDate: '2026-03-30', probability: 40, createdAt: '2025-11-03' },
  { id: 'DEAL-003', title: 'Apex Analytics Suite', customerId: 'CUS-007', amount: 42000, stage: 'Negotiation', owner: 'Sarah Wilson', expectedCloseDate: '2026-05-01', description: 'Full analytics platform including custom integrations.', probability: 75, createdAt: '2025-09-20' },
  { id: 'DEAL-004', title: 'Farrell Legal Bundle', customerId: 'CUS-009', amount: 15000, stage: 'New', owner: 'Emily Rodriguez', expectedCloseDate: '2026-06-12', probability: 20, createdAt: '2026-01-08' },
  { id: 'DEAL-005', title: 'TerraWater Data Platform', customerId: 'CUS-008', amount: 32000, stage: 'Won', owner: 'David Chen', expectedCloseDate: '2026-02-28', description: 'Closed deal — hydrogeology data platform.', probability: 100, createdAt: '2025-08-15' },
  { id: 'DEAL-006', title: 'BuildRight Engineering Tools', customerId: 'CUS-010', amount: 18500, stage: 'Proposal', owner: 'Sarah Wilson', expectedCloseDate: '2026-04-25', probability: 55, createdAt: '2025-12-01' },
  { id: 'DEAL-007', title: 'BrightAd Campaign Manager', customerId: 'CUS-011', amount: 9500, stage: 'Qualified', owner: 'David Chen', expectedCloseDate: '2026-05-15', probability: 45, createdAt: '2026-02-10' },
  { id: 'DEAL-008', title: 'Harmony Health Records', customerId: 'CUS-003', amount: 22000, stage: 'Negotiation', owner: 'Emily Rodriguez', expectedCloseDate: '2026-04-08', probability: 70, createdAt: '2025-10-28' },
  { id: 'DEAL-009', title: 'Paws & Care Vet Software', customerId: 'CUS-005', amount: 7500, stage: 'Won', owner: 'David Chen', expectedCloseDate: '2026-01-15', probability: 100, createdAt: '2025-07-22' },
  { id: 'DEAL-010', title: 'CleanCity Fleet Management', customerId: 'CUS-006', amount: 45000, stage: 'Proposal', owner: 'Emily Rodriguez', expectedCloseDate: '2026-05-30', probability: 50, createdAt: '2025-11-18' },
  { id: 'DEAL-011', title: 'AgriPlan Analytics Module', customerId: 'CUS-015', amount: 11000, stage: 'Lost', owner: 'Emily Rodriguez', expectedCloseDate: '2026-02-14', probability: 0, createdAt: '2025-09-05' },
  { id: 'DEAL-012', title: 'Peak Performance Dashboard', customerId: 'CUS-016', amount: 14000, stage: 'New', owner: 'Sarah Wilson', expectedCloseDate: '2026-07-01', probability: 15, createdAt: '2026-03-14' },
  { id: 'DEAL-013', title: 'HearWell Patient Portal', customerId: 'CUS-018', amount: 19000, stage: 'Qualified', owner: 'Emily Rodriguez', expectedCloseDate: '2026-06-15', probability: 35, createdAt: '2026-01-25' },
  { id: 'DEAL-014', title: 'Lifelong Learning Platform', customerId: 'CUS-019', amount: 28000, stage: 'Proposal', owner: 'Sarah Wilson', expectedCloseDate: '2026-05-20', probability: 60, createdAt: '2025-12-20' },
  { id: 'DEAL-015', title: 'Children First EMR System', customerId: 'CUS-020', amount: 55000, stage: 'Negotiation', owner: 'David Chen', expectedCloseDate: '2026-04-30', description: 'Electronic medical records for pediatric department.', probability: 80, createdAt: '2025-10-05' },
]

// re-export as `deals` so existing code keeps working (dashboard mock imports it)
export const deals = dealsSeed
