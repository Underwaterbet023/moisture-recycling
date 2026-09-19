import React from 'react';

export default function ResearchPage() {
  return (
    <div className="absolute inset-0 bg-[#050a18] overflow-y-auto z-20 pointer-events-auto p-8 text-slate-300">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="border-b border-cyan-500/20 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-cyan-300">Research — Mathematical Model & Data Documentation</h1>
          <p className="mt-2 text-slate-400">Atmospheric moisture transport and recycling mechanisms</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="space-y-8">
            {/* Section 1 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">1. Moisture Conservation Equation</h2>
              <p className="mb-4 text-sm">The foundation of Eulerian moisture tracking is the conservation equation in pressure coordinates:</p>
              <div className="bg-black/50 p-4 rounded font-mono text-cyan-300 mb-4 overflow-x-auto text-sm">
                ∂q/∂t + u·∂q/∂x + v·∂q/∂y + ω·∂q/∂p = S
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-400">
                <li><strong className="text-slate-300">q</strong>: Specific humidity (kg/kg)</li>
                <li><strong className="text-slate-300">u, v, ω</strong>: Zonal, meridional, and vertical wind</li>
                <li><strong className="text-slate-300">S = E - P</strong>: Source term (Evaporation - Precipitation)</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">3. Finite Difference Methods</h2>
              <p className="mb-4 text-sm">Spatial derivatives are computed using central differencing on the spherical grid:</p>
              <div className="bg-black/50 p-4 rounded font-mono text-cyan-300 space-y-2 mb-4 text-sm">
                <p>∂q/∂x ≈ (q[i+1,j] - q[i-1,j]) / (2Δx)</p>
                <p>∂q/∂y ≈ (q[i,j+1] - q[i,j-1]) / (2Δy)</p>
              </div>
              <p className="text-sm">Spherical corrections applied:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-400 mt-2">
                <li>Δx = R_earth · cos(φ) · Δλ</li>
                <li>Δy = R_earth · Δφ</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">5. Model Configuration</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-slate-700/50">
                    <tr><th className="py-2 pr-4 text-slate-300 font-medium">Dataset</th><td className="py-2 text-slate-400">ERA5 Reanalysis (Synthetic Demo)</td></tr>
                    <tr><th className="py-2 pr-4 text-slate-300 font-medium">Coordinate System</th><td className="py-2 text-slate-400">Spherical (Lat/Lon)</td></tr>
                    <tr><th className="py-2 pr-4 text-slate-300 font-medium">Pressure Levels</th><td className="py-2 text-slate-400">1000, 850, 700, 500, 300 hPa</td></tr>
                    <tr><th className="py-2 pr-4 text-slate-300 font-medium">Grid Spacing</th><td className="py-2 text-slate-400">0.25° × 0.25°</td></tr>
                    <tr><th className="py-2 pr-4 text-slate-300 font-medium">Time Step</th><td className="py-2 text-slate-400">Δt = 3600s (1 hour)</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* Section 2 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">2. Lagrangian Motion Equations</h2>
              <p className="mb-4 text-sm">Particle trajectories are calculated using kinematic 3D equations on a sphere:</p>
              <div className="bg-black/50 p-4 rounded font-mono text-cyan-300 space-y-2 mb-4 text-sm">
                <p>dλ/dt = u / (R · cos φ)</p>
                <p>dφ/dt = v / R</p>
                <p>dp/dt = ω</p>
              </div>
              <p className="text-sm text-slate-400">Where λ is longitude, φ is latitude, and R is Earth's radius.</p>
            </section>

            {/* Section 4 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">4. Vertical Integration</h2>
              <p className="mb-4 text-sm">Column-integrated quantities (Total Column Water, Moisture Flux):</p>
              <div className="bg-black/50 p-4 rounded font-mono text-cyan-300 space-y-2 mb-4 text-sm">
                <p>TCW = (1/g) ∫ q dp</p>
                <p>Q_x = (1/g) ∫ (q·u) dp</p>
                <p>Q_y = (1/g) ∫ (q·v) dp</p>
                <p>MFC = -∇·Q</p>
              </div>
              <p className="text-sm text-slate-400">Integration bounds are surface pressure to Top of Atmosphere.</p>
            </section>

            {/* Section 7 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">7. Assumptions & Limitations</h2>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
                <li>Hydrostatic balance is assumed (valid for large scale).</li>
                <li>Sub-grid scale turbulence and convection are parameterized.</li>
                <li>Phase changes (condensation/evaporation) occur instantaneously when saturation is reached.</li>
                <li>Precipitation falls vertically and instantly (no drift or evaporation of falling rain).</li>
              </ul>
            </section>
            
            {/* Section 8 */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-xl text-cyan-100 font-semibold mb-4">8. Integration Methods</h2>
              <p className="text-sm text-slate-400 mb-2">Two numerical integration methods are provided for Lagrangian tracking:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-400">
                <li><strong className="text-slate-300">Euler Forward:</strong> x(t+Δt) = x(t) + v(t)Δt. Faster but less accurate for curved flows.</li>
                <li><strong className="text-slate-300">Runge-Kutta 4th Order (RK4):</strong> Evaluates velocity at 4 intermediate points. Higher accuracy for complex wind fields.</li>
              </ul>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
