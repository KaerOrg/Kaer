import {
  Activity, AlertTriangle, Bell, Calendar, CheckCircle2, Circle,
  CircleDashed, Droplet, Frown, Handshake, Heart, Hourglass,
  Leaf, MapPin, Moon, PenLine, Smile, Star, Sun, Thermometer,
  Timer, Wrench, Zap, type LucideIcon,
} from 'lucide-react'
import type { FieldProps } from '../types'
import { FieldWidget } from '../FieldWidget'

const ICON_MAP: Record<string, LucideIcon> = {
  'activity':       Activity,
  'alert-triangle': AlertTriangle,
  'bell':           Bell,
  'calendar':       Calendar,
  'check-circle':   CheckCircle2,
  'circle':         Circle,
  'circle-dashed':  CircleDashed,
  'droplet':        Droplet,
  'frown':          Frown,
  'handshake':      Handshake,
  'heart':          Heart,
  'hourglass':      Hourglass,
  'leaf':           Leaf,
  'map-pin':        MapPin,
  'moon':           Moon,
  'pen-line':       PenLine,
  'smile':          Smile,
  'star':           Star,
  'sun':            Sun,
  'thermometer':    Thermometer,
  'timer':          Timer,
  'wrench':         Wrench,
  'zap':            Zap,
}

export function FieldRow({ field, t }: FieldProps) {
  const iconName = field.props['icon'] ?? ''
  const widgetType = field.props['widget_type']
  const detailCode = field.props['detail_code']
  const detailText = detailCode ? t(detailCode) : undefined
  const label = field.text_code ? t(field.text_code) : ''

  const IconComponent = ICON_MAP[iconName]

  return (
    <li className="preview-field">
      <div className="preview-field__header">
        {iconName && (
          <span className="preview-field__icon">
            {IconComponent ? <IconComponent size={14} /> : iconName}
          </span>
        )}
        <span className="preview-field__label">{label}</span>
      </div>
      <div className="preview-field__control">
        {widgetType
          ? <FieldWidget widgetType={widgetType} detailText={detailText} />
          : detailText && <span className="preview-field__detail">{detailText}</span>
        }
      </div>
    </li>
  )
}
