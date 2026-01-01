'use client';

/**
 * FormPreview Component
 *
 * Main form preview container that renders the form as applicants will see it.
 * Supports conditional visibility, validation, and sectioned layout.
 */

import { useState, useCallback, useMemo } from 'react';
import { RefreshCw, AlertCircle, CheckCircle2, ChevronUp, Zap, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Form, FormField, FormSection } from '@/lib/api/forms';
import { FormPreviewSection } from './FormPreviewSection';
import { FormPreviewField } from './FormPreviewField';
import { evaluateVisibilityRule, FormValues } from './utils/evaluateVisibilityRule';
import { validateField } from './utils/validateField';
import { useDeterminants } from '@/hooks/use-determinants';
import { useFormSchema } from '@/hooks/use-form-schema';
import type { Determinant } from '@/lib/api/determinants';

interface FormPreviewProps {
  form: Form;
  fields: FormField[];
  sections: FormSection[];
  serviceId: string;
  onRefresh?: () => void;
}

export function FormPreview({
  form,
  fields,
  sections,
  serviceId,
  onRefresh,
}: FormPreviewProps) {
  // Form values state
  const [values, setValues] = useState<FormValues>({});
  const [showValidation, setShowValidation] = useState(false);
  const [showDeterminants, setShowDeterminants] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  // Fetch service determinants
  const { data: determinantsResponse } = useDeterminants(serviceId, { isActive: true });

  // Fetch form schema (lazy - only when showSchema is true)
  const { data: schemaData, isLoading: schemaLoading } = useFormSchema(form.id, showSchema);

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

  // Compute determinant values from linked fields
  const determinantValues = useMemo(() => {
    const determinants = determinantsResponse?.data || [];
    if (determinants.length === 0) return [];

    return determinants.map((det: Determinant) => {
      // Find the field linked to this determinant
      const linkedField = fields.find((f) => f.determinantId === det.id);

      // Get the value from form values
      const fieldValue = linkedField ? values[linkedField.name] : undefined;

      return {
        determinant: det,
        linkedFieldName: linkedField?.name || null,
        value: fieldValue,
        hasValue: fieldValue !== undefined && fieldValue !== '',
      };
    });
  }, [determinantsResponse, fields, values]);

  // Count determinants with values
  const determinantStats = useMemo(() => {
    const total = determinantValues.length;
    const withValue = determinantValues.filter((d) => d.hasValue).length;
    return { total, withValue };
  }, [determinantValues]);

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
          {determinantStats.total > 0 && (
            <Button
              variant={showDeterminants ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowDeterminants(!showDeterminants)}
            >
              <Zap className="mr-1 h-4 w-4" />
              {determinantStats.withValue}/{determinantStats.total}
            </Button>
          )}
          <Button
            variant={showSchema ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowSchema(!showSchema)}
          >
            <Code2 className="mr-1 h-4 w-4" />
            Schema
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

      {/* Determinants Debug Panel */}
      {showDeterminants && determinantStats.total > 0 && (
        <div className="border-b border-black/10 bg-amber-50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Business Rule Values ({determinantStats.withValue}/{determinantStats.total})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeterminants(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4 text-amber-600" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {determinantValues.map((dv) => (
              <div
                key={dv.determinant.id}
                className={`rounded-md px-2 py-1.5 text-xs ${
                  dv.hasValue
                    ? 'bg-amber-100 border border-amber-200'
                    : 'bg-amber-50 border border-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-amber-800">
                    {dv.determinant.name}
                  </span>
                  <span className="text-amber-600 uppercase text-[10px]">
                    {dv.determinant.type}
                  </span>
                </div>
                <div className="mt-0.5">
                  {dv.hasValue ? (
                    <span className="font-mono text-amber-900">
                      {String(dv.value)}
                    </span>
                  ) : dv.linkedFieldName ? (
                    <span className="text-amber-500 italic">
                      &larr; {dv.linkedFieldName}
                    </span>
                  ) : (
                    <span className="text-amber-400 italic">No linked field</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schema Debug Panel */}
      {showSchema && (
        <div className="border-b border-black/10 bg-blue-50 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Generated Schema
                {schemaData?.version && (
                  <span className="ml-2 text-xs text-blue-500">
                    v{new Date(schemaData.version).toLocaleString()}
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSchema(false)}
              className="h-6 w-6 p-0"
            >
              <ChevronUp className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
          {schemaLoading ? (
            <div className="text-sm text-blue-600">Loading schema...</div>
          ) : schemaData ? (
            <div className="space-y-3">
              {/* JSON Schema */}
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">JSON Schema (Draft-07)</div>
                <pre className="bg-blue-100 border border-blue-200 rounded-md p-2 text-xs font-mono text-blue-900 overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(schemaData.jsonSchema, null, 2)}
                </pre>
              </div>
              {/* UI Schema */}
              <div>
                <div className="text-xs font-medium text-blue-700 mb-1">UI Schema (JSON Forms)</div>
                <pre className="bg-blue-100 border border-blue-200 rounded-md p-2 text-xs font-mono text-blue-900 overflow-x-auto max-h-40 overflow-y-auto">
                  {JSON.stringify(schemaData.uiSchema, null, 2)}
                </pre>
              </div>
              {/* Visibility Rules */}
              {(schemaData.rules.fields.length > 0 || schemaData.rules.sections.length > 0) && (
                <div>
                  <div className="text-xs font-medium text-blue-700 mb-1">
                    Visibility Rules ({schemaData.rules.fields.length + schemaData.rules.sections.length})
                  </div>
                  <pre className="bg-blue-100 border border-blue-200 rounded-md p-2 text-xs font-mono text-blue-900 overflow-x-auto max-h-40 overflow-y-auto">
                    {JSON.stringify(schemaData.rules, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-blue-500">No schema data available</div>
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
