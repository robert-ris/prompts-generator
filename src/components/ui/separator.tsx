import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import {cva, type VariantProps} from 'class-variance-authority';

import {cn} from '@/lib/utils';

const separatorVariants = cva(
  'shrink-0 bg-border',
  {
    variants: {
      orientation: {
        horizontal: 'h-px w-full',
        vertical: 'h-full w-px',
      },
      variant: {
        default: 'bg-border',
        muted: 'bg-muted',
        subtle: 'bg-border/50',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
      variant: 'default',
    },
  }
);

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> &
  VariantProps<typeof separatorVariants>
>(({className, orientation, variant, decorative = true, ...props}, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(separatorVariants({orientation, variant, className}))}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export {Separator, separatorVariants};

