'use client';

import * as React from 'react';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateCard } from './TemplateCard';
import { useTemplates, useTemplateCategories } from '@/hooks/use-templates';
import type { ServiceTemplate } from '@/lib/api/templates';

interface TemplateGalleryProps {
  onSelectTemplate: (template: ServiceTemplate) => void;
  selectedTemplateId?: string | null;
  isCreating?: boolean;
}

/**
 * Gallery component for browsing and selecting service templates
 *
 * Displays a searchable, filterable grid of template cards.
 * Used within the service creation flow.
 */
export function TemplateGallery({
  onSelectTemplate,
  selectedTemplateId,
  isCreating = false,
}: TemplateGalleryProps) {
  const [search, setSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = React.useState('');

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch templates with filters
  const {
    data: templatesData,
    isLoading: templatesLoading,
    error: templatesError,
  } = useTemplates({
    search: debouncedSearch || undefined,
    category: selectedCategory || undefined,
    limit: 20,
  });

  // Fetch categories for filter
  const { data: categories, isLoading: categoriesLoading } = useTemplateCategories();

  const templates = templatesData?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={isCreating}
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            disabled={isCreating}
          >
            All
          </Button>
          {categoriesLoading ? (
            <Badge variant="outline" className="animate-pulse">
              Loading...
            </Badge>
          ) : (
            categories?.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                disabled={isCreating}
              >
                {category}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Templates Grid */}
      {templatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : templatesError ? (
        <div className="flex items-center justify-center gap-2 py-12 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load templates. Please try again.</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mb-2 opacity-50" />
          <p>No templates found matching your criteria.</p>
          {(search || selectedCategory) && (
            <Button
              variant="link"
              onClick={() => {
                setSearch('');
                setSelectedCategory(null);
              }}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onSelectTemplate}
              isLoading={isCreating && selectedTemplateId === template.id}
              disabled={isCreating && selectedTemplateId !== template.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
