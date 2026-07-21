import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { FAQItem } from '@/data/faq'
import { cn } from '@/lib/utils'

interface FAQAccordionProps {
  items: FAQItem[]
  className?: string
  defaultOpen?: string
}

export function FAQAccordion({ items, className, defaultOpen }: FAQAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen}
      className={cn('w-full', className)}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
