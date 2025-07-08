import { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'gradient' | 'gradient-subtle' | 'soft-glow';
  gradientColor?: 'peach' | 'sage' | 'lavender' | 'default';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', gradientColor = 'peach', ...props }, ref) => {
    const gradientColorClass = gradientColor === 'default' ? '' : `-${gradientColor}`;
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-white',
          {
            'border border-warm-gray/10': variant === 'default',
            'shadow-md': variant === 'elevated',
            [`card-gradient-border card-gradient-border${gradientColorClass}`]: variant === 'gradient',
            [`card-gradient-border card-gradient-border${gradientColorClass} card-gradient-border-subtle`]: variant === 'gradient-subtle',
            'card-soft-glow': variant === 'soft-glow',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-warm-gray', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };