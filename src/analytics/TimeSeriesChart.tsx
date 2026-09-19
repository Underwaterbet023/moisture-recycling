import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const SYNTHETIC_DATA = Array.from({ length: 14 }).map((_, i) => {
  const date = new Date(2023, 6, 25 + i); // Jul 25 to Aug 07
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    precipitation: 5 + Math.random() * 25,
    et: 2 + Math.random() * 4,
    humidity: 0.008 + Math.random() * 0.007,
    flux: 150 + Math.random() * 200,
  };
});

type Tab = 'Precipitation' | 'ET' | 'Humidity' | 'Flux';

export default function TimeSeriesChart() {
  const [activeTab, setActiveTab] = useState<Tab>('Precipitation');

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-2 mb-2">
        {(['Precipitation', 'ET', 'Humidity', 'Flux'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-[10px] px-2 py-1 rounded transition-colors ${
              activeTab === tab 
                ? 'bg-cyan-500/30 text-cyan-100 border border-cyan-500/50' 
                : 'bg-black/20 text-cyan-500 hover:bg-cyan-900/30 border border-transparent'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'Precipitation' ? (
            <BarChart data={SYNTHETIC_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#88a', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#88a', fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: 'rgba(30,120,200,0.5)', borderRadius: '8px' }}
                itemStyle={{ color: '#0ea5e9' }}
              />
              <Bar dataKey="precipitation" fill="#0ea5e9" radius={[2, 2, 0, 0]} name="Precip (mm)" />
            </BarChart>
          ) : (
            <LineChart data={SYNTHETIC_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#88a', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis 
                tick={{ fill: '#88a', fontSize: 10 }} 
                tickLine={false} 
                axisLine={false} 
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: 'rgba(30,120,200,0.5)', borderRadius: '8px' }}
                itemStyle={{ color: '#38bdf8' }}
              />
              <Line 
                type="monotone" 
                dataKey={activeTab === 'ET' ? 'et' : activeTab === 'Humidity' ? 'humidity' : 'flux'} 
                stroke="#38bdf8" 
                strokeWidth={2}
                dot={false}
                name={activeTab === 'ET' ? 'ET (mm)' : activeTab === 'Humidity' ? 'Specific Humidity' : 'Moisture Flux'}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
