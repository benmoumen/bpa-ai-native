'use client';

/**
 * FormPreviewSection Component
 *
 * Renders a form section with collapsible functionality
 * and its contained fields.
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FormField, FormSection } from '@/lib/api/forms';
import { FormPreviewField } from './FormPreviewField';
import { evaluateVisibilityRule, FormValues } from './utils/evaluateVisibilityRule';

interface FormPreviewSectionProps {
  section: FormSection;
  fields: FormField[];
  values: FormValues;
  onChange: (fieldName: string, value: string | number | boolean | undefined) => void;
  showValidation?: boolean;
}

export function FormPreviewSection({
  section,
  fields,
  values,
  onChange,
  showValidation = false,
}: FormPreviewSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter fields that belong to this section and are visible
  const sectionFields = fields
    .filter((field) => field.sectionId === section.id && field.isActive)
    .filter((field) => evaluateVisibilityRule(field.visibilityRule, values))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // If no visible fields, don't render the section
  if (sectionFields.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-black/10 bg-white">
      {/* Section Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-black/5"
      >
        <div>
          <h3 className="text-base font-medium text-black">{section.name}</h3>
          {section.description && (
            <p className="mt-0.5 text-sm text-black/60">{section.description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <span>
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </Button>
      </button>

      {/* Section Content */}
      {!isCollapsed && (
        <div className="border-t border-black/10 px-4 py-4">
          <div className="space-y-4">
            {sectionFields.map((field) => (
              <FormPreviewField
                key={field.id}
                field={field}
                value={values[field.name]}
                onChange={onChange}
                showValidation={showValidation}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
