'use client';

/**
 * SectionHeader Component
 *
 * Displays a collapsible section header with title, description,
 * field count badge (when collapsed), and action menu.
 * Swiss-style minimal design with black borders.
 */

import { useCallback, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Settings2,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FormSection } from '@/lib/api/forms';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  section: FormSection;
  isExpanded: boolean;
  fieldCount: number;
  isEditable?: boolean;
  isSelected?: boolean;
  onToggle: () => void;
  onDelete: (section: FormSection) => void;
  onSelect: (section: FormSection) => void;
  onUpdateName: (name: string) => void;
}

export function SectionHeader({
  section,
  isExpanded,
  fieldCount,
  isEditable = true,
  isSelected = false,
  onToggle,
  onDelete,
  onSelect,
  onUpdateName,
}: SectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(section.name);

  const handleStartEdit = useCallback(() => {
    setEditingName(section.name);
    setIsEditing(true);
  }, [section.name]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditingName(section.name);
  }, [section.name]);

  const handleSaveEdit = useCallback(() => {
    if (!editingName.trim()) {
      handleCancelEdit();
      return;
    }

    if (editingName.trim() !== section.name) {
      onUpdateName(editingName.trim());
    }
    setIsEditing(false);
  }, [editingName, section.name, onUpdateName, handleCancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleHeaderClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't toggle if clicking on input or dropdown
      if ((e.target as HTMLElement).closest('input, [data-radix-dropdown-menu-trigger]')) {
        return;
      }
      onToggle();
    },
    [onToggle]
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-3 bg-black/[0.02] border-b border-black/10 cursor-pointer transition-colors hover:bg-black/[0.04]',
        isSelected && 'bg-black/5'
      )}
      onClick={handleHeaderClick}
    >
      {/* Expand/Collapse Icon */}
      <button
        type="button"
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-black/60" />
        ) : (
          <ChevronRight className="h-4 w-4 text-black/60" />
        )}
      </button>

      {/* Section Name */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm font-medium"
            autoFocus
            aria-label="Edit section name"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-black truncate">
              {section.name}
            </span>
            {isSelected && <Settings2 className="h-3 w-3 text-black/40 flex-shrink-0" />}
          </div>
        )}
        {section.description && isExpanded && (
          <p className="text-xs text-black/50 mt-0.5 truncate">{section.description}</p>
        )}
      </div>

      {/* Field Count Badge (shown when collapsed) */}
      {!isExpanded && (
        <Badge variant="secondary" className="flex-shrink-0">
          {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
        </Badge>
      )}

      {/* Actions */}
      {isEditable && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Actions for section ${section.name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSelect(section);
              }}
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Configure Properties
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Name
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(section);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
