import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { FAQItem } from '@/data/faq'
import { useTranslation } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface FAQAccordionProps {
  items: FAQItem[]
  className?: string
  defaultOpen?: string
}

export function FAQAccordion({ items, className, defaultOpen }: FAQAccordionProps) {
  const { t } = useTranslation()

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen}
      className={cn('w-full', className)}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionTrigger>{t(item.questionKey)}</AccordionTrigger>
          <AccordionContent>{t(item.answerKey)}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
