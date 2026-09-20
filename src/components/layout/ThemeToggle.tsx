import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import type { Theme } from '@/context/ThemeContext'

const THEME_ORDER: Theme[] = ['light', 'dark', 'system']

const ICONS: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const LABELS: Record<Theme, string> = {
  light: 'Switch to dark mode',
  dark: 'Switch to system theme',
  system: 'Switch to light mode',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  function cycle() {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
    setTheme(next)
  }

  const Icon = ICONS[theme]

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABELS[theme]}
      title={LABELS[theme]}
      className={[
        'rounded-md p-2 transition-colors',
        theme === 'dark'
          ? 'text-brand-400 hover:bg-slate-700 hover:text-brand-300'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
      ].join(' ')}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  )
}
