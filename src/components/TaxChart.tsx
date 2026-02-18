import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatEuro } from '@/lib/tax-engine';

interface TaxChartProps {
  impotAvant: number;
  impotApres: number;
  riAvant: number;
  riApres: number;
}

export default function TaxChart({ impotAvant, impotApres, riAvant, riApres }: TaxChartProps) {
  const impotData = [
    { name: 'Avant PER', value: impotAvant },
    { name: 'Après PER', value: impotApres },
  ];

  const riData = [
    { name: 'Avant PER', value: riAvant },
    { name: 'Après PER', value: riApres },
  ];

  const colors = ['hsl(220, 45%, 22%)', 'hsl(152, 60%, 40%)'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-lg bg-card p-2 card-shadow text-xs border border-border">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p>{formatEuro(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-xl bg-card card-shadow p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Impôt estimé</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={impotData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {impotData.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-card card-shadow p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Revenu imposable</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={riData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {riData.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
