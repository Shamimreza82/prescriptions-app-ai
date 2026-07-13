'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer } from '@/components/chart';

const PLAN_COLORS: Record<string, string> = {
  Premium: '#f59e0b',
  premium: '#f59e0b',
  Standard: '#3b82f6',
  standard: '#3b82f6',
  Basic: '#14b8a6',
  basic: '#14b8a6',
  Free: '#6b7280',
  free: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10b981',
  EXPIRED: '#ef4444',
  PENDING: '#f59e0b',
  CANCELLED: '#6b7280',
};

const DEFAULT_COLOR = '#6366f1';

const tooltipStyle = {
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  fontSize: '13px',
};

interface PlanDistributionChartProps {
  data: Array<{ plan: string; _count: number }>;
}

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  if (!data.length) {
    return (
      <ChartContainer title="Plan Distribution">
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No subscriptions</div>
      </ChartContainer>
    );
  }

  const total = data.reduce((sum, d) => sum + d._count, 0);
  const chartData = data.map(d => ({ ...d, total }));

  return (
    <ChartContainer title="Plan Distribution">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="_count"
              nameKey="plan"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={PLAN_COLORS[entry.plan] || DEFAULT_COLOR} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any, _name: any, props: any) => {
                const v = Number(value) || 0;
                const pct = props.payload?.total ? ((v / props.payload.total) * 100).toFixed(1) : '0';
                return [`${v.toLocaleString()} (${pct}%)`];
              }}
            />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

interface SubscriptionStatusChartProps {
  data: Array<{ status: string; _count: number }>;
}

export function SubscriptionStatusChart({ data }: SubscriptionStatusChartProps) {
  if (!data.length) {
    return (
      <ChartContainer title="Subscription Status">
        <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No data</div>
      </ChartContainer>
    );
  }

  const total = data.reduce((sum, d) => sum + d._count, 0);
  const chartData = data.map(d => ({ ...d, total }));

  return (
    <ChartContainer title="Subscription Status">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="_count"
              nameKey="status"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={STATUS_COLORS[entry.status] || DEFAULT_COLOR} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any, _name: any, props: any) => {
                const v = Number(value) || 0;
                const pct = props.payload?.total ? ((v / props.payload.total) * 100).toFixed(1) : '0';
                return [`${v.toLocaleString()} (${pct}%)`];
              }}
            />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}

interface KeyMetricsChartProps {
  activeDoctors: number;
  totalPatients: number;
  totalPrescriptions: number;
}

export function KeyMetricsChart({ activeDoctors, totalPatients, totalPrescriptions }: KeyMetricsChartProps) {
  const data = [
    { name: 'Active Doctors', value: activeDoctors, fill: '#6366f1' },
    { name: 'Total Patients', value: totalPatients, fill: '#14b8a6' },
    { name: 'Total Prescriptions', value: totalPrescriptions, fill: '#f59e0b' },
  ];

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <ChartContainer title="Key Metrics" description="Platform activity overview">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 500 }} stroke="#9ca3af" interval={0} />
            <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} domain={[0, maxValue * 1.15]} />
            <Tooltip
              contentStyle={tooltipStyle}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={65}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  );
}
