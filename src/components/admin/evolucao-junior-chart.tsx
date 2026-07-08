"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Ponto {
  mes: string;
  sozinho: number;
  comIa: number;
  comBruno: number;
  taxaEscalonamento: number;
}

export function EvolucaoJuniorChart({ dados }: { dados: Ponto[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={dados}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis yAxisId="esquerda" allowDecimals={false} />
        <YAxis yAxisId="direita" orientation="right" unit="%" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="esquerda" dataKey="sozinho" stackId="a" name="Sozinho" fill="#3b82f6" />
        <Bar yAxisId="esquerda" dataKey="comIa" stackId="a" name="Com IA" fill="#a855f7" />
        <Bar yAxisId="esquerda" dataKey="comBruno" stackId="a" name="Com Bruno" fill="#f97316" />
        <Line yAxisId="direita" dataKey="taxaEscalonamento" name="Taxa de escalonamento (%)" stroke="#ef4444" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
