'use client';

/**
 * FormPreview Component
 *
 * Main form preview container that renders the form as applicants will see it.
 * Supports conditional visibility, validation, and sectioned layout.
 */

import { useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Form, FormField, FormSection } from '@/lib/api/forms';
import { FormPreviewSection } from './FormPreviewSection';
import { FormPreviewField } from './FormPreviewField';
import { evaluateVisibilityRule, FormValues } from './utils/evaluateVisibilityRule';
import { validateField } from './utils/validateField';

interface FormPreviewProps {
  form: Form;
  fields: FormField[];
  sections: FormSection[];
  onRefresh?: () => void;
}

export function FormPreview({
  form,
  fields,
  sections,
  onRefresh,
}: FormPreviewProps) {
  // Form values state
  const [values, setValues] = useState<FormValues>({});
  const [showValidation, setShowValidation] = useState(false);

  // Handle field value change
  const handleChange = useCallback(
    (fieldName: string, value: string | number | boolean | undefined) => {
      setValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }));
    },
    []
  );

  // Reset form
  const handleReset = useCallback(() => {
    setValues({});
    setShowValidation(false);
  }, []);

  // Validate all visible fields
  const validateAllFields = useCallback(() => {
    setShowValidation(true);
  }, []);

  // Get active sections (sorted by sortOrder)
  const activeSections = useMemo(() => {
    return sections
      .filter((s) => s.isActive)
      .filter((s) => evaluateVisibilityRule(s.visibilityRule, values))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sections, values]);

  // Get fields without sections (orphaned fields)
  const orphanedFields = useMemo(() => {
    return fields
      .filter((f) => !f.sectionId && f.isActive)
      .filter((f) => evaluateVisibilityRule(f.visibilityRule, values))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [fields, values]);

  // Calculate validation summary
  const validationSummary = useMemo(() => {
    if (!showValidation) return null;

    const visibleFields = fields.filter((f) => {
      if (!f.isActive) return false;
      if (!evaluateVisibilityRule(f.visibilityRule, values)) return false;
      // If field has a section, check section visibility too
      if (f.sectionId) {
        const section = sections.find((s) => s.id === f.sectionId);
        if (section && !evaluateVisibilityRule(section.visibilityRule, values)) {
          return false;
        }
      }
      return true;
    });

    let errors = 0;
    visibleFields.forEach((field) => {
      const validation = validateField(field, values[field.name]);
      if (!validation.isValid) errors++;
    });

    return { total: visibleFields.length, errors };
  }, [showValidation, fields, sections, values]);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-black/10 bg-white px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-black">Form Preview</h2>
          <p className="text-sm text-black/60">
            Preview how applicants will see this form
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Refresh
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset
          </Button>
          <Button size="sm" onClick={validateAllFields}>
            Validate
          </Button>
        </div>
      </div>

      {/* Validation Summary */}
      {validationSummary && (
        <div
          className={`flex items-center gap-2 px-4 py-2 ${
            validationSummary.errors > 0
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {validationSummary.errors > 0 ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                {validationSummary.errors} of {validationSummary.total} fields have
                validation errors
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">All fields are valid</span>
            </>
          )}
        </div>
      )}

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Form Title */}
          <div className="rounded-md bg-white p-4">
            <h1 className="text-xl font-semibold text-black">{form.name}</h1>
          </div>

          {/* Orphaned Fields (no section) */}
          {orphanedFields.length > 0 && (
            <div className="rounded-md border border-black/10 bg-white p-4">
              <div className="space-y-4">
                {orphanedFields.map((field) => (
                  <FormPreviewField
                    key={field.id}
                    field={field}
                    value={values[field.name]}
                    onChange={handleChange}
                    showValidation={showValidation}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sections */}
          {activeSections.map((section) => (
            <FormPreviewSection
              key={section.id}
              section={section}
              fields={fields}
              values={values}
              onChange={handleChange}
              showValidation={showValidation}
            />
          ))}

          {/* Empty State */}
          {orphanedFields.length === 0 && activeSections.length === 0 && (
            <div className="rounded-md bg-white p-8 text-center">
              <p className="text-black/50">
                No visible fields. Add fields to the form or adjust visibility rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
