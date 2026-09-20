import { Briefcase, Building2, Calendar, Mail, Phone, User } from 'lucide-react'
import type { Customer } from '@/types/customer'

interface CustomerInfoCardProps {
  customer: Customer
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-0.5 text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}

export function CustomerInfoCard({ customer }: CustomerInfoCardProps) {
  const createdDate = new Date(customer.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        {customer.avatar ? (
          <img
            src={customer.avatar}
            alt={`${customer.firstName} ${customer.lastName}`}
            className="h-10 w-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {customer.firstName[0]}{customer.lastName[0]}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {customer.firstName} {customer.lastName}
          </p>
          <p className="text-xs text-slate-500">{customer.jobTitle}</p>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">Contact details</h3>
      <div className="mt-4 space-y-4">
        <InfoRow icon={Building2} label="Company">
          {customer.company}
        </InfoRow>

        <InfoRow icon={Mail} label="Email">
          <a
            href={`mailto:${customer.email}`}
            className="text-brand-600 hover:underline"
          >
            {customer.email}
          </a>
        </InfoRow>

        <InfoRow icon={Phone} label="Phone">
          {customer.phone}
        </InfoRow>

        <InfoRow icon={Briefcase} label="Job title">
          {customer.jobTitle}
        </InfoRow>

        <InfoRow icon={User} label="Owner">
          {customer.owner}
        </InfoRow>

        <InfoRow icon={Calendar} label="Customer since">
          {createdDate}
        </InfoRow>
      </div>
    </div>
  )
}
