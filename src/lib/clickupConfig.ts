/**
 * ClickUp integration configuration — stored in localStorage.
 *
 * Workspace details for the connected ClickUp workspace:
 *   Workspace ID : 8447923
 *   Default list : "Fixes and Improvements"  (ID: 900700247859)
 *   List URL     : https://app.clickup.com/8447923
 */

export interface ClickUpConfig {
  apiToken: string        // Personal API token from ClickUp settings
  workspaceId: string    // Team/workspace ID
  listId: string         // Target list ID for CRM tickets
  listName: string       // Display name
  listUrl: string        // URL for links
  enabled: boolean
}

const KEY = 'crm_clickup_config'

export const DEFAULT_CONFIG: ClickUpConfig = {
  apiToken: '',
  workspaceId: '8447923',
  listId: '900700247859',
  listName: 'Fixes and Improvements',
  listUrl: 'https://app.clickup.com/8447923/v/l/li/900700247859',
  enabled: false,
}

export function getClickUpConfig(): ClickUpConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) as Partial<ClickUpConfig> }
  } catch { /* ignore */ }
  return { ...DEFAULT_CONFIG }
}

export function saveClickUpConfig(config: ClickUpConfig): void {
  try { localStorage.setItem(KEY, JSON.stringify(config)) } catch { /* quota */ }
}

export function isClickUpEnabled(): boolean {
  const cfg = getClickUpConfig()
  return cfg.enabled && cfg.apiToken.trim().length > 0
}

/** Map CRM ticket priority → ClickUp priority string */
export const PRIORITY_MAP: Record<string, 'urgent' | 'high' | 'normal' | 'low'> = {
  Critical: 'urgent',
  High:     'high',
  Medium:   'normal',
  Low:      'low',
}
