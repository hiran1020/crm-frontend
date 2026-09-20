import {
  Briefcase,
  Calendar,
  FileText,
  Mail,
  Phone,
  Plus,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { computeLeadScore, scoreLabel } from '@/lib/leadScore'
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
import { TagPicker } from '@/components/common/TagPicker'
import { useToast } from '@/components/common/ToastProvider'
import { AIInsightsPanel } from '@/components/common/AIInsightsPanel'
import { ConvertLeadModal } from '@/components/leads/ConvertLeadModal'
import { LeadFormModal } from '@/components/leads/LeadFormModal'
import { LeadStatusBadge } from '@/components/leads/LeadStatusBadge'
import { useCreateActivity, useLeadActivities } from '@/hooks/useActivities'
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '@/hooks/useAttachments'
import {
  useConvertLead,
  useDeleteLead,
  useLead,
  useUpdateLead,
} from '@/hooks/useLeads'
import { useTags } from '@/hooks/useTags'
import { formatCurrency } from '@/lib/format'
import type { ActivityFormValues } from '@/schemas/activity'
import type { LeadFormValues } from '@/schemas/lead'

type TabId = 'activities' | 'notes' | 'files'

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-100" />
      <div className="flex items-start gap-4">
        <div className="h-10 w-56 rounded bg-slate-100" />
        <div className="ml-auto flex gap-2">
          <div className="h-9 w-24 rounded bg-slate-100" />
          <div className="h-9 w-20 rounded bg-slate-100" />
          <div className="h-9 w-20 rounded bg-slate-100" />
        </div>
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
  icon: typeof Phone
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

export function LeadDetailsPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { user } = useAuth()
  const permissions = usePermissions()
  const leadQuery = useLead(leadId ?? '')
  usePageTitle(leadQuery.data ? leadQuery.data.name : 'Lead')

  const [activeTab, setActiveTab] = useState<TabId>('activities')
  const [formOpen, setFormOpen] = useState(false)
  const [convertOpen, setConvertOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [activityDefaultType, setActivityDefaultType] = useState<
    'call' | 'email' | 'meeting' | 'note' | 'task'
  >('call')

  const activitiesQuery = useLeadActivities(leadId ?? '')
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLead()
  const createActivity = useCreateActivity()
  const allTags = useTags()

  const attachmentsQuery = useAttachments(leadId ?? '', 'lead')
  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment(leadId ?? '', 'lead')

  if (!leadId) {
    return <ErrorState message="No lead ID found in URL" />
  }

  if (leadQuery.isLoading) {
    return <PageSkeleton />
  }

  if (leadQuery.isError) {
    return (
      <ErrorState
        title="Could not load lead"
        message={
          leadQuery.error instanceof Error
            ? leadQuery.error.message
            : 'Unknown error'
        }
        onRetry={() => void leadQuery.refetch()}
      />
    )
  }

  const lead = leadQuery.data
  if (!lead) return null

  const activityCount = activitiesQuery.data?.length
  const fileCount = attachmentsQuery.data?.length

  const tabs = [
    { id: 'activities', label: 'Activities', count: activityCount },
    { id: 'notes', label: 'Notes' },
    { id: 'files', label: 'Files', count: fileCount },
  ]

  async function handleFormSubmit(values: LeadFormValues) {
    try {
      await updateLead.mutateAsync({ id: lead.id, input: values })
      notify('Lead updated')
      setFormOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not update lead',
        'error',
      )
    }
  }

  async function handleTagsChange(tagIds: string[]) {
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        input: {
          name: lead.name,
          company: lead.company,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
          value: lead.value,
          owner: lead.owner,
          notes: lead.notes,
          tags: tagIds,
        },
      })
    } catch {
      notify('Could not update tags', 'error')
    }
  }

  async function handleConvertConfirm() {
    try {
      await convertLead.mutateAsync(lead.id)
      notify('Lead converted to customer')
      setConvertOpen(false)
      navigate('/leads')
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not convert lead',
        'error',
      )
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteLead.mutateAsync(lead.id)
      notify('Lead deleted')
      navigate('/leads')
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete lead',
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
        relatedTo: lead.id,
        relatedType: 'lead',
        relatedName: lead.name,
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

  const notes = (activitiesQuery.data ?? []).filter((a) => a.type === 'note')

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Leads', href: '/leads' },
        { label: lead.name },
      ]} />

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">{lead.name}</h2>
          <p className="text-sm text-slate-500">{lead.company}</p>
          <LeadStatusBadge status={lead.status} />
          {(() => {
            const score = computeLeadScore(lead)
            const { label, color } = scoreLabel(score)
            return (
              <span
                title={`Lead score: ${score}/100`}
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  color,
                ].join(' ')}
              >
                {label} ({score})
              </span>
            )
          })()}
          <p className="text-sm font-semibold text-slate-700">
            {formatCurrency(lead.value)}
          </p>
          <TagPicker
            selectedTagIds={lead.tags ?? []}
            allTags={allTags}
            onChange={(tagIds) => void handleTagsChange(tagIds)}
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openActivityForm('call')}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Log Activity
          </button>
          {permissions.canEditLead(lead.owner) ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
          ) : null}
          {permissions.canConvertLead &&
          lead.status !== 'Converted' &&
          lead.status !== 'Lost' ? (
            <button
              type="button"
              onClick={() => setConvertOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <UserCheck className="h-4 w-4" aria-hidden />
              Convert
            </button>
          ) : null}
          {permissions.canDeleteLead(lead.owner) ? (
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

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: info card + AI Insights */}
        <div className="space-y-4">
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Lead details</h3>
          <div className="mt-4 space-y-4">
            <InfoRow icon={Mail} label="Email">
              <a
                href={`mailto:${lead.email}`}
                className="text-brand-600 hover:underline"
              >
                {lead.email}
              </a>
            </InfoRow>
            <InfoRow icon={Phone} label="Phone">
              {lead.phone || '—'}
            </InfoRow>
            <InfoRow icon={Briefcase} label="Source">
              {lead.source}
            </InfoRow>
            <InfoRow icon={UserCheck} label="Owner">
              {lead.owner}
            </InfoRow>
            <InfoRow icon={Calendar} label="Created">
              {new Date(lead.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </InfoRow>
            {lead.notes ? (
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">Notes</p>
                <p className="mt-1 text-sm text-slate-700">{lead.notes}</p>
              </div>
            ) : null}
          </div>
        </div>
        <AIInsightsPanel
          entityType="lead"
          entityId={lead.id}
          entityData={lead}
          onAction={(key) => {
            if (key === 'send_email')    { openActivityForm('email');   return }
            if (key === 'create_quote')  { navigate('/quotes');         return }
            if (key === 'log_meeting')   { openActivityForm('meeting'); return }
            if (key === 'log_note')      { openActivityForm('note');    return }
            if (key === 'log_email')     { openActivityForm('email');   return }
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
                  description="Log a call, email, or meeting to start tracking interactions."
                  actionLabel="Log Activity"
                  onAction={() => openActivityForm('call')}
                />
              ) : (
                <ActivityList activities={activitiesQuery.data ?? []} />
              )}
            </div>
          ) : activeTab === 'notes' ? (
            /* Notes tab */
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
                  description="Add notes to keep track of important details about this lead."
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
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
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
                    relatedTo: lead.id,
                    relatedType: 'lead',
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

      {/* Edit modal */}
      <LeadFormModal
        open={formOpen}
        lead={lead}
        busy={updateLead.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Activity form modal */}
      <ActivityFormModal
        open={activityFormOpen}
        defaultType={activityDefaultType}
        context={{
          relatedTo: lead.id,
          relatedType: 'lead',
          relatedName: lead.name,
        }}
        busy={createActivity.isPending}
        onClose={() => setActivityFormOpen(false)}
        onSubmit={handleActivitySubmit}
      />

      {/* Convert modal */}
      <ConvertLeadModal
        open={convertOpen}
        lead={lead}
        busy={convertLead.isPending}
        onClose={() => setConvertOpen(false)}
        onConfirm={() => void handleConvertConfirm()}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete lead?"
        description={`Remove ${lead.name} from your leads list? This cannot be undone in the current session.`}
        busy={deleteLead.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  )
}
