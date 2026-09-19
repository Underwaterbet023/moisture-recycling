import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useSimulationStore } from '@/simulation/simulationStore';

const COLORS = {
  Ocean: '#0088cc',
  Forest: '#34d399',
  Agriculture: '#80e060',
  River: '#4090ff',
  Other: '#8888aa',
};

export default function SourceContributionChart() {
  const sourceContribution = useSimulationStore((state) => state.sourceContribution);

  const data = Object.entries(sourceContribution).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.Other} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: 'rgba(30,120,200,0.5)', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Contribution']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-sm font-bold text-white">100%</span>
        </div>
      </div>
      <div className="text-[9px] text-cyan-500/50 text-center mt-1">Demo/Synthetic values</div>
    </div>
  );
}
