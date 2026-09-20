import {
  Building2,
  Calendar,
  Copy,
  DollarSign,
  FileText,
  Pencil,
  Plus,
  Target,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuth } from '@/context/AuthContext'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { ActivityFormModal } from '@/components/activities/ActivityFormModal'
import { ActivityList } from '@/components/activities/ActivityList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FileList } from '@/components/common/FileList'
import { FileUpload } from '@/components/common/FileUpload'
import { TabNav } from '@/components/common/TabNav'
import { useToast } from '@/components/common/ToastProvider'
import { AIInsightsPanel } from '@/components/common/AIInsightsPanel'
import { DealFormModal } from '@/components/deals/DealFormModal'
import { useCreateActivity, useDealActivities } from '@/hooks/useActivities'
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '@/hooks/useAttachments'
import { useCustomers } from '@/hooks/useCustomers'
import {
  useCreateDeal,
  useDeleteDeal,
  useDeal,
  useUpdateDeal,
  useUpdateDealStage,
} from '@/hooks/useDeals'
import { formatCurrency } from '@/lib/format'
import type { ActivityFormValues } from '@/schemas/activity'
import type { DealFormValues } from '@/schemas/deal'
import type { DealStage } from '@/types/deal'

const STAGE_ORDER: DealStage[] = [
  'New',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
]

const STAGE_STYLES: Record<DealStage, { bg: string; text: string; ring: string }> = {
  New: { bg: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-300' },
  Qualified: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-300' },
  Proposal: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-300' },
  Negotiation: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-300' },
  Won: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-400' },
  Lost: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-300' },
}

type TabId = 'activities' | 'notes' | 'files'

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-100" />
      <div className="h-10 w-64 rounded bg-slate-100" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-lg bg-slate-100" />
        <div className="h-64 rounded-lg bg-slate-100 lg:col-span-2" />
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

export function DealDetailsPage() {
  const { dealId } = useParams<{ dealId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { user } = useAuth()
  const permissions = usePermissions()
  const dealQuery = useDeal(dealId ?? '')
  usePageTitle(dealQuery.data ? dealQuery.data.title : 'Deal')

  const [activeTab, setActiveTab] = useState<TabId>('activities')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [activityDefaultType, setActivityDefaultType] = useState<
    'call' | 'email' | 'meeting' | 'note' | 'task'
  >('call')

  const activitiesQuery = useDealActivities(dealId ?? '')
  const customersQuery = useCustomers({ pageSize: 200 })
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()
  const cloneDeal = useCreateDeal()
  const updateStage = useUpdateDealStage()
  const createActivity = useCreateActivity()

  const attachmentsQuery = useAttachments(dealId ?? '', 'deal')
  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment(dealId ?? '', 'deal')

  if (!dealId) return <ErrorState message="No deal ID found in URL" />
  if (dealQuery.isLoading) return <PageSkeleton />
  if (dealQuery.isError) {
    return (
      <ErrorState
        title="Could not load deal"
        message={
          dealQuery.error instanceof Error
            ? dealQuery.error.message
            : 'Unknown error'
        }
        onRetry={() => void dealQuery.refetch()}
      />
    )
  }

  const maybeDeal = dealQuery.data
  if (!maybeDeal) return null
  const deal = maybeDeal

  const customers = customersQuery.data?.data ?? []
  const customer = customers.find((c) => c.id === deal.customerId)
  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : deal.customerId

  const activityCount = activitiesQuery.data?.length
  const fileCount = attachmentsQuery.data?.length
  const notes = (activitiesQuery.data ?? []).filter((a) => a.type === 'note')

  const tabs = [
    { id: 'activities', label: 'Activities', count: activityCount },
    { id: 'notes', label: 'Notes', count: notes.length || undefined },
    { id: 'files', label: 'Files', count: fileCount },
  ]

  async function handleFormSubmit(values: DealFormValues) {
    try {
      await updateDeal.mutateAsync({ id: deal.id, input: values })
      notify('Deal updated')
      setFormOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not update deal',
        'error',
      )
    }
  }

  async function handleStageChange(stage: DealStage) {
    if (stage === deal.stage) return
    try {
      await updateStage.mutateAsync({ id: deal.id, stage })
      notify(`Stage changed to ${stage}`)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not change stage',
        'error',
      )
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteDeal.mutateAsync(deal.id)
      notify('Deal deleted')
      navigate('/deals')
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete deal',
        'error',
      )
    }
  }

  function openActivityForm(type: typeof activityDefaultType) {
    setActivityDefaultType(type)
    setActivityFormOpen(true)
  }

  async function handleActivitySubmit(values: ActivityFormValues) {
    try {
      await createActivity.mutateAsync({
        type: values.type,
        title: values.title,
        description: values.description,
        owner: values.owner,
        completed: values.completed,
        dueDate: values.type === 'task' ? values.dueDate : undefined,
        priority: values.type === 'task' ? values.priority : undefined,
        relatedTo: deal.id,
        relatedType: 'deal',
        relatedName: deal.title,
      })
      notify('Activity logged')
      setActivityFormOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not log activity',
        'error',
      )
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Pipeline', href: '/deals' },
        { label: deal.title },
      ]} />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{deal.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{customerName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => openActivityForm('call')}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Log Activity
            </button>
            {/* Clone deal */}
            <button
              type="button"
              disabled={cloneDeal.isPending}
              onClick={async () => {
                try {
                  const cloned = await cloneDeal.mutateAsync({
                    title: `${deal.title} (Copy)`,
                    customerId: deal.customerId,
                    amount: deal.amount,
                    stage: 'New',
                    owner: deal.owner,
                    expectedCloseDate: deal.expectedCloseDate,
                    description: deal.description,
                    probability: 10,
                  })
                  notify('Deal cloned')
                  navigate(`/deals/${cloned.id}`)
                } catch {
                  notify('Could not clone deal', 'error')
                }
              }}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" aria-hidden />
              Clone
            </button>
            {permissions.canEditDeal(deal.owner) ? (
              <button
                type="button"
                onClick={() => setFormOpen(true)}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </button>
            ) : null}
            {permissions.canDeleteDeal(deal.owner) ? (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Delete
              </button>
            ) : null}
          </div>
        </div>

        {/* Stage changer — only visible to admins and managers */}
        {permissions.canMoveDealStage ? (
        <div className="flex flex-wrap gap-1.5">
          {STAGE_ORDER.map((stage) => {
            const styles = STAGE_STYLES[stage]
            const isCurrent = stage === deal.stage
            return (
              <button
                key={stage}
                type="button"
                onClick={() => void handleStageChange(stage)}
                disabled={updateStage.isPending}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium transition-all',
                  isCurrent
                    ? `${styles.bg} ${styles.text} ring-2 ${styles.ring}`
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  updateStage.isPending ? 'opacity-50 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {stage}
              </button>
            )
          })}
        </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-slate-50 px-3 py-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STAGE_STYLES[deal.stage].bg} ${STAGE_STYLES[deal.stage].text}`}>
              {deal.stage}
            </span>
            <span className="text-xs text-slate-400">Stage changes require manager or admin role</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: deal info + AI Insights */}
        <div className="space-y-4">
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Deal details</h3>
          <div className="mt-4 space-y-4">
            <InfoRow icon={DollarSign} label="Amount">
              <span className="text-base font-semibold text-slate-900">
                {formatCurrency(deal.amount)}
              </span>
            </InfoRow>
            <InfoRow icon={Building2} label="Customer">
              <button
                type="button"
                onClick={() =>
                  customer && navigate(`/customers/${customer.id}`)
                }
                className="text-brand-600 hover:underline"
              >
                {customerName}
              </button>
            </InfoRow>
            <InfoRow icon={Calendar} label="Expected close">
              {deal.expectedCloseDate}
            </InfoRow>
            <InfoRow icon={User} label="Owner">
              {deal.owner}
            </InfoRow>
            {deal.probability !== undefined ? (
              <InfoRow icon={Target} label="Probability">
                <div>
                  <span className="font-medium">{deal.probability}%</span>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${deal.probability}%` }}
                    />
                  </div>
                </div>
              </InfoRow>
            ) : null}
            {deal.description ? (
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Description</p>
                <p className="mt-1 text-sm text-slate-700">{deal.description}</p>
              </div>
            ) : null}
          </div>
        </div>
        <AIInsightsPanel
          entityType="deal"
          entityId={deal.id}
          entityData={deal}
          onAction={(key) => {
            if (key === 'log_meeting')  { openActivityForm('meeting'); return }
            if (key === 'log_note')     { openActivityForm('note');    return }
            if (key === 'log_email')    { openActivityForm('email');   return }
            if (key === 'send_email')   { openActivityForm('email');   return }
            if (key === 'create_quote') { navigate('/quotes');         return }
            openActivityForm('call')  // default: log_call, view_activities
          }}
        />
        </div>

        {/* Right: tabs */}
        <div className="space-y-4 lg:col-span-2">
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
          />

          {activeTab === 'activities' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openActivityForm('call')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Log Activity
                </button>
              </div>
              {activitiesQuery.isLoading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : (activitiesQuery.data?.length ?? 0) === 0 ? (
                <EmptyState
                  title="No activities yet"
                  description="Log a call, email, or meeting for this deal."
                  actionLabel="Log Activity"
                  onAction={() => openActivityForm('call')}
                />
              ) : (
                <ActivityList activities={activitiesQuery.data ?? []} />
              )}
            </div>
          ) : activeTab === 'notes' ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openActivityForm('note')}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add Note
                </button>
              </div>
              {notes.length === 0 ? (
                <EmptyState
                  title="No notes yet"
                  description="Add notes to track important context for this deal."
                  actionLabel="Add Note"
                  onAction={() => openActivityForm('note')}
                />
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-lg border border-border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800">{note.title}</p>
                          {note.description ? (
                            <p className="mt-1 text-xs text-slate-500">{note.description}</p>
                          ) : null}
                          <p className="mt-2 text-xs text-slate-400">
                            {note.owner} ·{' '}
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Files tab */
            <div className="space-y-4">
              <FileUpload
                busy={uploadAttachment.isPending}
                onUpload={async (file) => {
                  await uploadAttachment.mutateAsync({
                    file,
                    relatedTo: deal.id,
                    relatedType: 'deal',
                    uploadedBy: user?.name ?? 'Unknown',
                  })
                  notify('File uploaded')
                }}
              />
              <FileList
                attachments={attachmentsQuery.data ?? []}
                onDelete={(id) => {
                  void deleteAttachment.mutateAsync(id)
                }}
                deleteBusy={deleteAttachment.isPending}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <DealFormModal
        open={formOpen}
        deal={deal}
        busy={updateDeal.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ActivityFormModal
        open={activityFormOpen}
        defaultType={activityDefaultType}
        context={{ relatedTo: deal.id, relatedType: 'deal', relatedName: deal.title }}
        busy={createActivity.isPending}
        onClose={() => setActivityFormOpen(false)}
        onSubmit={handleActivitySubmit}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete deal?"
        description={`Remove "${deal.title}" from your pipeline? This cannot be undone in the current session.`}
        busy={deleteDeal.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}
