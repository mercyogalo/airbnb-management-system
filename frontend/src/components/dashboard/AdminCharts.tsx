'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface AdminChartsProps {
  roleData: Array<{ name: string; value: number }>;
  propertyStatusData: Array<{ status: string; count: number }>;
}

const pieColors = ['#7C4A2D', '#A0522D', '#D1B39E'];

export function AdminCharts({ roleData, propertyStatusData }: AdminChartsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <article className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
        <h3 className="text-xl font-semibold">Guests vs host</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={105} label>
                {roleData.map((entry, index) => (
                  <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="rounded-2xl border border-secondary/10 bg-white p-5 shadow-soft">
        <h3 className="text-xl font-semibold">Properties by Status</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={propertyStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1e8df" />
              <XAxis dataKey="status" stroke="#7C4A2D" />
              <YAxis stroke="#7C4A2D" />
              <Tooltip />
              <Bar dataKey="count" fill="#7C4A2D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </div>
  );
}
