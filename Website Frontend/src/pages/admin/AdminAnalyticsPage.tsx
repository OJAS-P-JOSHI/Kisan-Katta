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
import { useAdminAnalytics } from '@/hooks/useAdmin'

const PIE_COLORS = ['#1A4D2E', '#4F772D', '#6B9B3A', '#A3B18A', '#DAD7CD', '#588157']

export function AdminAnalyticsPage() {
  const { data, isLoading, isError } = useAdminAnalytics()

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Revenue, registrations, and district distribution."
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
          label="Districts tracked"
          value={isLoading ? '—' : (data?.districtDistribution.length ?? 0)}
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
                  <Bar dataKey="revenueInr" fill="#4F772D" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          <AdminCard title="District registrations">
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.districtDistribution ?? []}
                  layout="vertical"
                  margin={{ left: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0DBD0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="district"
                    width={100}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2D5A27" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminCard>

          <AdminCard title="Status breakdown">
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
