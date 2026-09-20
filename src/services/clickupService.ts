/**
 * ClickUp REST API v2 integration.
 *
 * Called from the browser using a Personal API Token.
 * ClickUp's API allows cross-origin requests with a valid token.
 *
 * In production with a Rails backend:
 *   POST /api/clickup/tasks  →  backend proxies to ClickUp (avoids exposing token in browser)
 */

import { getClickUpConfig, PRIORITY_MAP } from '@/lib/clickupConfig'
import type { Ticket } from '@/types/ticket'

const CLICKUP_API = 'https://api.clickup.com/api/v2'

export interface ClickUpTask {
  id: string
  name: string
  url: string
  status: { status: string }
  priority?: { priority: string }
}

export interface PushResult {
  success: boolean
  task?: ClickUpTask
  error?: string
}

/**
 * Push a CRM ticket to ClickUp as a task.
 * Returns the created task with its ID and URL.
 */
export async function pushTicketToClickUp(ticket: Ticket): Promise<PushResult> {
  const config = getClickUpConfig()

  if (!config.enabled || !config.apiToken) {
    return { success: false, error: 'ClickUp integration is not configured. Go to Integrations to set up your API token.' }
  }

  const priority = PRIORITY_MAP[ticket.priority] ?? 'normal'

  const description = buildDescription(ticket)

  try {
    const response = await fetch(`${CLICKUP_API}/list/${config.listId}/task`, {
      method: 'POST',
      headers: {
        'Authorization': config.apiToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `[CRM] ${ticket.title} (${ticket.id})`,
        markdown_description: description,
        priority,
        status: 'to do',
        tags: ['crm', 'support', ticket.category.toLowerCase().replace(/ /g, '-')],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ err: response.statusText }))
      return {
        success: false,
        error: `ClickUp API error ${response.status}: ${JSON.stringify(err)}`,
      }
    }

    const task = await response.json() as ClickUpTask
    return { success: true, task }

  } catch (err) {
    // Common cause: browser CORS restriction on some environments.
    // In that case a backend proxy is needed.
    const message = err instanceof TypeError && err.message.includes('fetch')
      ? 'Network error — ClickUp API may require a backend proxy in this environment. Your token and config are saved correctly.'
      : String(err)
    return { success: false, error: message }
  }
}

/**
 * Verify an API token by fetching the authorized user.
 */
export async function verifyClickUpToken(token: string): Promise<{ valid: boolean; name?: string; error?: string }> {
  try {
    const response = await fetch(`${CLICKUP_API}/user`, {
      headers: { 'Authorization': token },
    })
    if (!response.ok) return { valid: false, error: `HTTP ${response.status}` }
    const data = await response.json() as { user: { username: string; email: string } }
    return { valid: true, name: data.user.username || data.user.email }
  } catch {
    return { valid: false, error: 'Network error — could not reach ClickUp API' }
  }
}

/** Build the ClickUp task description in Markdown */
function buildDescription(ticket: Ticket): string {
  const lines: string[] = [
    `## CRM Support Ticket: ${ticket.id}`,
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Customer** | ${ticket.customerName ?? '—'} |`,
    `| **Category** | ${ticket.category} |`,
    `| **Priority** | ${ticket.priority} |`,
    `| **Status** | ${ticket.status} |`,
    `| **Assigned to** | ${ticket.assignedTo} |`,
    `| **Reported by** | ${ticket.createdBy} |`,
    `| **Created** | ${ticket.createdAt.slice(0, 10)} |`,
    '',
    '## Description',
    '',
    ticket.description,
  ]

  const publicComments = ticket.comments.filter(c => !c.isInternal)
  if (publicComments.length > 0) {
    lines.push('', '## Customer Replies', '')
    publicComments.forEach(c => {
      lines.push(`**${c.author}** _(${c.createdAt.slice(0, 10)})_`)
      lines.push(c.body)
      lines.push('')
    })
  }

  const internalNotes = ticket.comments.filter(c => c.isInternal)
  if (internalNotes.length > 0) {
    lines.push('', '## Internal Notes', '')
    internalNotes.forEach(n => {
      lines.push(`🔒 **${n.author}** _(${n.createdAt.slice(0, 10)})_`)
      lines.push(n.body)
      lines.push('')
    })
  }

  lines.push('', '---', '*Pushed from PulseCRM Help Desk*')
  return lines.join('\n')
}
