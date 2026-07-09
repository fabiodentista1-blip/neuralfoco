"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const CORES = ["#0d9488", "#14b8a6", "#5eead4", "#a78bfa", "#f97316", "#ef4444", "#3b82f6", "#eab308"];

export function DistribuicaoDonut({ dados }: { dados: { nome: string; valor: number }[] }) {
  if (dados.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={dados} dataKey="valor" nameKey="nome" innerRadius={48} outerRadius={78} paddingAngle={2}>
          {dados.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
