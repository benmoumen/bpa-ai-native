import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-black text-white',
        secondary: 'border-transparent bg-slate-100 text-black',
        destructive: 'border-transparent bg-red-600 text-white',
        outline: 'border-black/20 text-black',
        draft: 'border-amber-200 bg-amber-50 text-amber-700',
        published: 'border-green-200 bg-green-50 text-green-700',
        archived: 'border-slate-200 bg-slate-100 text-slate-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
