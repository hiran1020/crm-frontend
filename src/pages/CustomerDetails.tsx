import { PinButton } from '@/components/common/PinButton'
import { FileText, Mail, Pencil, Plus, Trash2 } from 'lucide-react'
import { CustomerHealthScoreCard } from '@/components/customers/CustomerHealthScoreCard'
import { CustomerOnboarding } from '@/components/customers/CustomerOnboarding'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency } from '@/lib/format'
import { trackView } from '@/lib/recentlyViewed'
import { useAuth } from '@/context/AuthContext'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { EmailComposerModal } from '@/components/activities/EmailComposerModal'
import { ActivityFormModal } from '@/components/activities/ActivityFormModal'
import { ActivityList } from '@/components/activities/ActivityList'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { FileList } from '@/components/common/FileList'
import { FileUpload } from '@/components/common/FileUpload'
import { TabNav } from '@/components/common/TabNav'
import { TagPicker } from '@/components/common/TagPicker'
import { CustomerTimeline } from '@/components/common/Timeline'
import { useToast } from '@/components/common/ToastProvider'
import { AIInsightsPanel } from '@/components/common/AIInsightsPanel'
import { AvatarUpload } from '@/components/customers/AvatarUpload'
import { CustomerDealsList } from '@/components/customers/CustomerDealsList'
import { CustomerFormModal } from '@/components/customers/CustomerFormModal'
import { CustomerInfoCard } from '@/components/customers/CustomerInfoCard'
import { StatusBadge } from '@/components/customers/StatusBadge'
import { MOCK_OWNERS } from '@/constants/auth'
import { useCreateActivity, useCustomerActivities } from '@/hooks/useActivities'
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from '@/hooks/useAttachments'
import {
  useCustomer,
  useCustomerOwners,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/hooks/useCustomers'
import { useCustomerDeals } from '@/hooks/useDeals'
import { useTags } from '@/hooks/useTags'
import type { ActivityFormValues } from '@/schemas/activity'
import type { CustomerFormValues } from '@/schemas/customer'

const TABS = ['deals', 'activities', 'notes', 'files', 'timeline', '360', 'onboarding'] as const
type TabId = (typeof TABS)[number]

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-4 w-24 rounded bg-slate-100" />
      </div>
      <div className="flex items-start gap-4">
        <div className="h-10 w-56 rounded bg-slate-100" />
        <div className="ml-auto flex gap-2">
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

export function CustomerDetailsPage() {
  const { customerId } = useParams<{ customerId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()
  const { user } = useAuth()
  const permissions = usePermissions()
  const customerQuery = useCustomer(customerId ?? '')
  usePageTitle(
    customerQuery.data
      ? `${customerQuery.data.firstName} ${customerQuery.data.lastName}`
      : 'Customer',
  )

  const [activeTab, setActiveTab] = useState<TabId>('deals')
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [activityDefaultType, setActivityDefaultType] = useState<
    'call' | 'email' | 'meeting' | 'note' | 'task'
  >('call')

  const ownersQuery = useCustomerOwners()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()
  const createActivity = useCreateActivity()
  const allTags = useTags()

  // Preload counts for tabs
  const dealsQuery = useCustomerDeals(customerId ?? '')
  const activitiesQuery = useCustomerActivities(customerId ?? '')
  const attachmentsQuery = useAttachments(customerId ?? '', 'customer')
  const uploadAttachment = useUploadAttachment()
  const deleteAttachment = useDeleteAttachment(customerId ?? '', 'customer')

  // Track recently viewed — must be before any early returns (Rules of Hooks)
  useEffect(() => {
    const customer = customerQuery.data
    if (!customer) return
    trackView({
      id: customer.id,
      type: 'customer',
      label: `${customer.firstName} ${customer.lastName}`,
      sub: customer.company,
      href: `/customers/${customer.id}`,
    })
  }, [customerQuery.data?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!customerId) {
    return <ErrorState message="No customer ID found in URL" />
  }

  if (customerQuery.isLoading) {
    return <PageSkeleton />
  }

  if (customerQuery.isError) {
    return (
      <ErrorState
        title="Could not load customer"
        message={
          customerQuery.error instanceof Error
            ? customerQuery.error.message
            : 'Unknown error'
        }
        onRetry={() => void customerQuery.refetch()}
      />
    )
  }

  const customer = customerQuery.data
  if (!customer) return null

  const _owners = ownersQuery.data ?? [...MOCK_OWNERS]
  const dealCount = dealsQuery.data?.length
  const activityCount = activitiesQuery.data?.length
  const fileCount = attachmentsQuery.data?.length

  const totalDealValue = dealsQuery.data?.reduce((s, d) => s + d.amount, 0) ?? 0
  const wonValue = dealsQuery.data?.filter((d) => d.stage === 'Won').reduce((s, d) => s + d.amount, 0) ?? 0

  const tabs = [
    { id: 'deals', label: 'Deals', count: dealCount },
    { id: 'activities', label: 'Activities', count: activityCount },
    { id: 'notes', label: 'Notes' },
    { id: 'files', label: 'Files', count: fileCount },
    { id: 'timeline', label: 'Timeline' },
    { id: '360', label: '360°' },
    { id: 'onboarding', label: 'Onboarding' },
  ]

  async function handleFormSubmit(values: CustomerFormValues) {
    try {
      await updateCustomer.mutateAsync({ id: customer.id, input: values })
      notify('Customer updated')
      setFormOpen(false)
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not update customer',
        'error',
      )
    }
  }

  async function handleDeleteConfirm() {
    try {
      await deleteCustomer.mutateAsync(customer.id)
      notify('Customer deleted')
      navigate('/customers')
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Could not delete customer',
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
        relatedTo: customer.id,
        relatedType: 'customer',
        relatedName: `${customer.firstName} ${customer.lastName}`,
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

  async function handleAvatarUpload(dataUrl: string) {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        input: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          jobTitle: customer.jobTitle,
          status: customer.status,
          owner: customer.owner,
          avatar: dataUrl,
          tags: customer.tags,
        },
      })
      notify('Photo updated')
    } catch {
      notify('Could not update photo', 'error')
    }
  }

  async function handleTagsChange(tagIds: string[]) {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        input: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          jobTitle: customer.jobTitle,
          status: customer.status,
          owner: customer.owner,
          avatar: customer.avatar,
          tags: tagIds,
        },
      })
    } catch {
      notify('Could not update tags', 'error')
    }
  }

  const notes = (activitiesQuery.data ?? []).filter((a) => a.type === 'note')

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Customers', href: '/customers' },
        { label: `${customer.firstName} ${customer.lastName}` },
      ]} />

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <AvatarUpload
            avatar={customer.avatar}
            name={`${customer.firstName} ${customer.lastName}`}
            onUpload={(dataUrl) => void handleAvatarUpload(dataUrl)}
            size="md"
          />
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {customer.firstName} {customer.lastName}
            </h2>
            <p className="text-sm text-slate-500">{customer.company}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={customer.status} />
              <TagPicker
                selectedTagIds={customer.tags ?? []}
                allTags={allTags}
                onChange={(tagIds) => void handleTagsChange(tagIds)}
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PinButton
            id={customer.id}
            type="customer"
            label={`${customer.firstName} ${customer.lastName}`}
            sub={customer.company}
            href={`/customers/${customer.id}`}
          />
          <button
            type="button"
            onClick={() => setEmailOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Email
          </button>
          <button
            type="button"
            onClick={() => openActivityForm('call')}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Log Activity
          </button>
          {permissions.canEditCustomer(customer.owner) ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Edit
            </button>
          ) : null}
          {permissions.canDeleteCustomer(customer.owner) ? (
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
        {/* Left: contact info + LTV */}
        <div className="space-y-4">
          <CustomerInfoCard customer={customer} />
          <AIInsightsPanel
            entityType="customer"
            entityId={customer.id}
            entityData={customer}
            onAction={(key) => {
              if (key === 'send_email') { setEmailOpen(true); return }
              if (key === 'log_meeting') { openActivityForm('meeting'); return }
              if (key === 'log_note')    { openActivityForm('note');    return }
              if (key === 'log_email')   { openActivityForm('email');   return }
              if (key === 'create_quote') { navigate('/quotes');        return }
              openActivityForm('call')   // default
            }}
          />
          {dealsQuery.data && dealsQuery.data.length > 0 && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs text-slate-500">Pipeline value</p>
                <p className="mt-0.5 text-lg font-semibold text-slate-900">
                  {formatCurrency(totalDealValue)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Won revenue</p>
                <p className="mt-0.5 text-lg font-semibold text-emerald-700">
                  {formatCurrency(wonValue)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: tabbed content */}
        <div className="space-y-4 lg:col-span-2">
          <TabNav
            tabs={tabs}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as TabId)}
          />

          {activeTab === 'deals' ? (
            <CustomerDealsList customerId={customerId} />
          ) : activeTab === 'activities' ? (
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
                  description="Add notes to keep track of important details about this customer."
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
          ) : activeTab === 'files' ? (
            <div className="space-y-4">
              <FileUpload
                busy={uploadAttachment.isPending}
                onUpload={async (file) => {
                  await uploadAttachment.mutateAsync({
                    file,
                    relatedTo: customer.id,
                    relatedType: 'customer',
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
          ) : activeTab === 'timeline' ? (
            <CustomerTimeline customerId={customerId} />
          ) : activeTab === '360' ? (
            <div className="space-y-5">
              <CustomerHealthScoreCard customerId={customerId} />
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-white p-4 shadow-sm text-center">
                  <p className="text-xs text-slate-500">Open Deals</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {(dealsQuery.data ?? []).filter((d) => !['Won', 'Lost'].includes(d.stage)).length}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-4 shadow-sm text-center">
                  <p className="text-xs text-slate-500">Won Revenue</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">
                    {formatCurrency(wonValue)}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-white p-4 shadow-sm text-center">
                  <p className="text-xs text-slate-500">Activities</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {activitiesQuery.data?.length ?? 0}
                  </p>
                </div>
              </div>
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Recent Activity</h3>
                {(activitiesQuery.data?.length ?? 0) === 0 ? (
                  <EmptyState
                    title="No activities yet"
                    description="Log a call, email, or meeting to start tracking interactions."
                  />
                ) : (
                  <ActivityList activities={(activitiesQuery.data ?? []).slice(0, 3)} />
                )}
              </section>
              <section>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Active Deals</h3>
                <CustomerDealsList customerId={customerId} />
              </section>
            </div>
          ) : activeTab === 'onboarding' ? (
            <CustomerOnboarding customerId={customerId} />
          ) : null}
        </div>
      </div>

      {/* Edit modal */}
      <CustomerFormModal
        open={formOpen}
        customer={customer}
        busy={updateCustomer.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Activity form modal */}
      <ActivityFormModal
        open={activityFormOpen}
        defaultType={activityDefaultType}
        context={{
          relatedTo: customer.id,
          relatedType: 'customer',
          relatedName: `${customer.firstName} ${customer.lastName}`,
        }}
        busy={createActivity.isPending}
        onClose={() => setActivityFormOpen(false)}
        onSubmit={handleActivitySubmit}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete customer?"
        description={`Remove ${customer.firstName} ${customer.lastName} from your customer list? This cannot be undone in the current session.`}
        busy={deleteCustomer.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
      />

      {/* Email composer */}
      <EmailComposerModal
        open={emailOpen}
        toName={`${customer.firstName} ${customer.lastName}`}
        toEmail={customer.email}
        company={customer.company}
        onClose={() => setEmailOpen(false)}
        onSend={async (subject, body) => {
          await createActivity.mutateAsync({
            type: 'email',
            title: subject,
            description: body,
            owner: user?.name ?? 'Unknown',
            completed: true,
            relatedTo: customer.id,
            relatedType: 'customer',
            relatedName: `${customer.firstName} ${customer.lastName}`,
          })
          notify('Email logged as activity')
          setEmailOpen(false)
        }}
        busy={createActivity.isPending}
      />
    </div>
  )
}
