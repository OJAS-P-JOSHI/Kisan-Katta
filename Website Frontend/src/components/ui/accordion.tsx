import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

export const Accordion = AccordionPrimitive.Root

export const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn('border-b border-border', className)}
    {...props}
  />
))
AccordionItem.displayName = 'AccordionItem'

export const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-5 text-left text-base font-medium transition-all hover:text-primary [&[data-state=open]>svg]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

export const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm text-muted-foreground data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pb-5 leading-relaxed', className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName
