import { useUITheme } from '@/contexts/UIThemeContext'

export interface ChartColors {
  revenue:    string
  cost:       string
  profit:     string
  grid:       string
  text:       string
  goal:       string
  accent:     string
  accentMid:  string
  background: string
  tooltip:    string
  tooltipText:string
}

const DARK_OPERATOR: ChartColors = {
  revenue:     '#7B7FD4',
  cost:        '#E06060',
  profit:      '#4ADE80',
  grid:        'rgba(255,255,255,0.08)',
  text:        '#9BA5B8',
  goal:        '#E8A838',
  accent:      '#6366f1',
  accentMid:   '#8b5cf6',
  background:  '#16213E',
  tooltip:     '#1E2A45',
  tooltipText: '#FFFFFF',
}

const ARCTIC_EXECUTIVE: ChartColors = {
  revenue:     '#4B6CB7',
  cost:        '#E5A0A0',
  profit:      '#0F6B3A',
  grid:        'rgba(0,0,0,0.06)',
  text:        '#6B7589',
  goal:        '#B8960C',
  accent:      '#1A2744',
  accentMid:   '#2C4A8A',
  background:  '#FFFFFF',
  tooltip:     '#FFFFFF',
  tooltipText: '#0D1117',
}

export function useChartColors(): ChartColors {
  const { isArctic } = useUITheme()
  return isArctic ? ARCTIC_EXECUTIVE : DARK_OPERATOR
}
