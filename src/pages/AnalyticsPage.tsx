import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { useSimulationStore } from '@/simulation/simulationStore';

// Synthetic Data
const TIME_SERIES = Array.from({ length: 30 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  precip: 5 + Math.random() * 20,
  et: 2 + Math.random() * 5,
  humidity: 8 + Math.random() * 4,
  flux: 150 + Math.random() * 100,
  ratio: 10 + Math.random() * 15
}));

const RESIDENCE_TIME = [
  { days: '1-3', count: 150 },
  { days: '3-6', count: 320 },
  { days: '6-9', count: 450 },
  { days: '9-12', count: 210 },
  { days: '12+', count: 80 },
];

const TRAJECTORY_DIST = [
  { dist: '<500km', count: 120 },
  { dist: '500-1000', count: 280 },
  { dist: '1000-2000', count: 410 },
  { dist: '2000-3000', count: 250 },
  { dist: '>3000km', count: 90 },
];

export default function AnalyticsPage() {
  const sourceContribution = useSimulationStore((state) => state.sourceContribution);

  const pieData = Object.entries(sourceContribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088cc', '#34d399', '#80e060', '#4090ff', '#8888aa'];

  return (
    <div className="absolute inset-0 bg-[#050a18] overflow-y-auto z-20 pointer-events-auto p-8 text-white">
      <h1 className="text-3xl font-bold text-cyan-300 mb-8 border-b border-cyan-500/20 pb-4">
        Moisture Recycling Analytics
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Source Contribution */}
        <div className="glass-panel p-4 h-80 flex flex-col">
          <h2 className="text-lg text-cyan-100 mb-2">Source Contribution</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="40%" outerRadius="80%">
                  {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: '#0ea5e9' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Precipitation */}
        <div className="glass-panel p-4 h-80 flex flex-col">
          <h2 className="text-lg text-cyan-100 mb-2">Precipitation & ET (mm/day)</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: '#0ea5e9' }} />
                <Line type="monotone" dataKey="precip" stroke="#38bdf8" name="Precipitation" />
                <Line type="monotone" dataKey="et" stroke="#34d399" name="Evapotranspiration" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recycling Ratio */}
        <div className="glass-panel p-4 h-80 flex flex-col">
          <h2 className="text-lg text-cyan-100 mb-2">Recycling Ratio (%)</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: '#0ea5e9' }} />
                <Line type="monotone" dataKey="ratio" stroke="#818cf8" strokeWidth={2} name="Recycling %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Residence Time */}
        <div className="glass-panel p-4 h-80 flex flex-col">
          <h2 className="text-lg text-cyan-100 mb-2">Atmospheric Residence Time</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RESIDENCE_TIME}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="days" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: '#0ea5e9' }} />
                <Bar dataKey="count" fill="#60a5fa" name="Particles" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trajectory Distance */}
        <div className="glass-panel p-4 h-80 flex flex-col">
          <h2 className="text-lg text-cyan-100 mb-2">Transport Distance (km)</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRAJECTORY_DIST}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="dist" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: '#0ea5e9' }} />
                <Bar dataKey="count" fill="#c084fc" name="Particles" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Specific Humidity */}
        <div className="glass-panel p-4 h-80 flex flex-col">
          <h2 className="text-lg text-cyan-100 mb-2">Specific Humidity (g/kg)</h2>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" hide />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(10,20,40,0.9)', borderColor: '#0ea5e9' }} />
                <Line type="monotone" dataKey="humidity" stroke="#f472b6" name="Specific Humidity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
