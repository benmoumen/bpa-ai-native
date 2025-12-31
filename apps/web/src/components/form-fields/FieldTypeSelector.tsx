'use client';

/**
 * FieldTypeSelector Component
 *
 * A grid of field type options with icons.
 * Used in the AddFieldDialog to select the type of field to add.
 * Swiss-style minimal design with clear iconography.
 */

import {
  Type,
  AlignLeft,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  CheckSquare,
  Upload,
  Mail,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldType } from '@/lib/api/forms';

interface FieldTypeOption {
  type: FieldType;
  label: string;
  description: string;
  icon: LucideIcon;
}

const FIELD_TYPE_OPTIONS: FieldTypeOption[] = [
  {
    type: 'TEXT',
    label: 'Text',
    description: 'Single line text input',
    icon: Type,
  },
  {
    type: 'TEXTAREA',
    label: 'Text Area',
    description: 'Multi-line text input',
    icon: AlignLeft,
  },
  {
    type: 'NUMBER',
    label: 'Number',
    description: 'Numeric input',
    icon: Hash,
  },
  {
    type: 'DATE',
    label: 'Date',
    description: 'Date picker',
    icon: Calendar,
  },
  {
    type: 'SELECT',
    label: 'Select',
    description: 'Dropdown selection',
    icon: ChevronDown,
  },
  {
    type: 'RADIO',
    label: 'Radio',
    description: 'Single choice options',
    icon: Circle,
  },
  {
    type: 'CHECKBOX',
    label: 'Checkbox',
    description: 'Multiple choice options',
    icon: CheckSquare,
  },
  {
    type: 'FILE',
    label: 'File',
    description: 'File upload',
    icon: Upload,
  },
  {
    type: 'EMAIL',
    label: 'Email',
    description: 'Email address input',
    icon: Mail,
  },
  {
    type: 'PHONE',
    label: 'Phone',
    description: 'Phone number input',
    icon: Phone,
  },
];

interface FieldTypeSelectorProps {
  onSelect: (type: FieldType) => void;
  disabled?: boolean;
}

export function FieldTypeSelector({ onSelect, disabled }: FieldTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {FIELD_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onSelect(option.type)}
            disabled={disabled}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-black/10 p-4',
              'transition-all duration-150',
              'hover:border-black hover:bg-black/5',
              'focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
            aria-label={`Add ${option.label} field`}
          >
            <Icon className="h-6 w-6 text-black/70" aria-hidden="true" />
            <span className="text-sm font-medium text-black">{option.label}</span>
            <span className="text-xs text-black/50 text-center leading-tight">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get the icon component for a field type
 */
export function getFieldTypeIcon(type: string): LucideIcon {
  const option = FIELD_TYPE_OPTIONS.find((o) => o.type === type);
  return option?.icon ?? Type;
}

/**
 * Get the label for a field type
 */
export function getFieldTypeLabel(type: string): string {
  const option = FIELD_TYPE_OPTIONS.find((o) => o.type === type);
  return option?.label ?? type;
}

export { FIELD_TYPE_OPTIONS };
