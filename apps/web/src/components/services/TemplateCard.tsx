'use client';

import { FileText, GitBranch, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ServiceTemplate } from '@/lib/api/templates';

interface TemplateCardProps {
  template: ServiceTemplate;
  onSelect: (template: ServiceTemplate) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Card component for displaying a service template
 *
 * Shows template metadata (name, description, category) and quick stats
 * (form count, workflow steps). Allows selection for creating a new service.
 */
export function TemplateCard({
  template,
  onSelect,
  isLoading = false,
  disabled = false,
}: TemplateCardProps) {
  return (
    <div
      className={`group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Category Badge */}
      <Badge variant="secondary" className="mb-3">
        {template.category}
      </Badge>

      {/* Template Name */}
      <h3 className="mb-2 font-semibold text-lg leading-tight">
        {template.name}
      </h3>

      {/* Description */}
      {template.description && (
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {template.description}
        </p>
      )}

      {/* Quick Stats */}
      <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span>{template.formCount} forms</span>
        </div>
        <div className="flex items-center gap-1.5">
          <GitBranch className="h-4 w-4" />
          <span>{template.workflowSteps} steps</span>
        </div>
      </div>

      {/* Use Template Button */}
      <Button
        className="w-full"
        variant="outline"
        onClick={() => onSelect(template)}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          'Use Template'
        )}
      </Button>
    </div>
  );
}
