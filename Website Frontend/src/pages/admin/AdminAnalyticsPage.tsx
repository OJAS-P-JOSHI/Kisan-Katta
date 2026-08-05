import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  AdminCard,
  AdminPageHeader,
  StatCard,
  TableSkeleton,
  formatInr,
} from '@/components/admin/AdminUI'
import {
  useAdminAnalytics,
  useAdminAnalyticsLocations,
} from '@/hooks/useAdmin'

const PIE_COLORS = [
  '#1A4D2E',
  '#4F772D',
  '#6B9B3A',
  '#A3B18A',
  '#DAD7CD',
  '#588157',
]

const LEVEL_LABEL: Record<'district' | 'taluka' | 'village', string> = {
  district: 'Districts',
  taluka: 'Talukas',
  village: 'Villages',
}

export function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useAdminAnalytics()
  const [district, setDistrict] = useState<string | undefined>()
  const [taluka, setTaluka] = useState<string | undefined>()

  const locationQuery = useMemo(
    () => ({
      district,
      taluka,
    }),
    [district, taluka],
  )

  const locations = useAdminAnalyticsLocations(locationQuery)
  const level = locations.data?.level ?? 'district'

  const drillInto = (name: string) => {
    if (level === 'district') {
      setDistrict(name)
      setTaluka(undefined)
      return
    }
    if (level === 'taluka') {
      setTaluka(name)
    }
  }

  const chartTitle =
    level === 'village'
      ? `Villages in ${taluka}, ${district}`
      : level === 'taluka'
        ? `Talukas in ${district}`
        : 'Farmers by district'

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Revenue, Gram Sahakari trends, and farmer location (district → taluka → village)."
      />

      {isError ? (
        <AdminCard>
          <p className="text-sm text-red-600">Unable to load analytics.</p>
        </AdminCard>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={isLoading ? '—' : formatInr(data?.revenueInr ?? 0)}
          tone="green"
        />
        <StatCard
          label="Applications"
          value={isLoading ? '—' : (data?.applications ?? 0)}
        />
        <StatCard
          label="Payment Success Rate"
          value={isLoading ? '—' : `${data?.paymentSuccessRate ?? 0}%`}
        />
        <StatCard
          label="Farmers in scope"
          value={
            locations.isLoading
              ? '—'
              : (locations.data?.totalInScope ?? 0)
          }
          hint={LEVEL_LABEL[level]}
        />
      </div>

      {isLoading ? (
        <AdminCard>
          <TableSkeleton rows={8} />
        </AdminCard>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminCard title="Monthly growth">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.monthlyGrowth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0DBD0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#1A4D2E"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          <AdminCard title="Monthly revenue">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.monthlyGrowth ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0DBD0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="revenueInr"
                    fill="#4F772D"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          <AdminCard
            title={chartTitle}
            className="xl:col-span-2"
            action={
              district || taluka ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-forest-700 hover:underline"
                  onClick={() => {
                    if (taluka) setTaluka(undefined)
                    else setDistrict(undefined)
                  }}
                >
                  Back
                </button>
              ) : null
            }
          >
            <nav
              className="mb-3 flex flex-wrap items-center gap-1 text-xs text-steel"
              aria-label="Location breadcrumb"
            >
              <button
                type="button"
                className={
                  !district
                    ? 'font-semibold text-forest-800'
                    : 'hover:text-forest-700 hover:underline'
                }
                onClick={() => {
                  setDistrict(undefined)
                  setTaluka(undefined)
                }}
              >
                All districts
              </button>
              {district ? (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <button
                    type="button"
                    className={
                      !taluka
                        ? 'font-semibold text-forest-800'
                        : 'hover:text-forest-700 hover:underline'
                    }
                    onClick={() => setTaluka(undefined)}
                  >
                    {district}
                  </button>
                </>
              ) : null}
              {taluka ? (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="font-semibold text-forest-800">{taluka}</span>
                </>
              ) : null}
            </nav>

            {locations.isError ? (
              <p className="text-sm text-red-600">
                Unable to load location breakdown.
              </p>
            ) : locations.isLoading ? (
              <TableSkeleton rows={6} />
            ) : (locations.data?.items.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-sm text-steel">
                No farmer profiles with location data at this level.
              </p>
            ) : (
              <>
                <p className="mb-2 text-xs text-steel">
                  {level === 'village'
                    ? 'Village level — end of drill-down.'
                    : 'Click a bar to drill down.'}{' '}
                  Showing top {locations.data?.items.length ?? 0} of{' '}
                  {locations.data?.totalInScope ?? 0} farmers in scope.
                </p>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={locations.data?.items ?? []}
                      layout="vertical"
                      margin={{ left: 8, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0DBD0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#2D5A27"
                        radius={[0, 6, 6, 0]}
                        cursor={level === 'village' ? 'default' : 'pointer'}
                        onClick={(entry) => {
                          const name = (entry as { name?: string })?.name
                          if (name && level !== 'village') drillInto(name)
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </AdminCard>

          <AdminCard title="GS status breakdown" className="xl:col-span-2">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.statusBreakdown ?? []}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {(data?.statusBreakdown ?? []).map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  )
}
