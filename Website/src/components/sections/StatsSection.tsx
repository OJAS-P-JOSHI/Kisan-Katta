import { motion } from 'framer-motion'

import { AnimatedCounter } from '@/components/common/AnimatedCounter'
import { stats } from '@/data/features'
import { fadeUp, staggerContainer, defaultTransition } from '@/lib/motion'

export function StatsSection() {
  return (
    <section className="section-padding bg-cream">
      <div className="container-wide">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={staggerContainer}
          className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              transition={{ ...defaultTransition, delay: index * 0.1 }}
              className="rounded-2xl border border-border/60 bg-white p-4 text-center shadow-soft sm:p-6 md:p-8"
            >
              <p className="text-2xl font-bold text-forest-900 sm:text-3xl md:text-4xl lg:text-5xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-1.5 text-xs font-medium leading-snug text-muted-foreground sm:mt-2 sm:text-sm">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
