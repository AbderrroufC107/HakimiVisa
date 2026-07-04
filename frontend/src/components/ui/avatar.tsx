import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Root, Image, Fallback } from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const Avatar = forwardRef<
  React.ComponentRef<typeof Root>,
  ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
  <Root
    ref={ref}
    className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

const AvatarImage = forwardRef<
  React.ComponentRef<typeof Image>,
  ComponentPropsWithoutRef<typeof Image>
>(({ className, ...props }, ref) => (
  <Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = forwardRef<
  React.ComponentRef<typeof Fallback>,
  ComponentPropsWithoutRef<typeof Fallback>
>(({ className, ...props }, ref) => (
  <Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
