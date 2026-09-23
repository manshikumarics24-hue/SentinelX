import React from 'react';
import PropTypes from 'prop-types';
import { Activity, Zap, ShieldAlert } from 'lucide-react';

const MetricCards = ({ currentRps, peakRps, status }) => {
  const isAnomaly = status === 'ANOMALY';

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Current RPS
          </p>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {currentRps}
          </p>
        </div>
        <div className="p-3 bg-cyan-500/10 rounded-full">
          <Activity className="w-6 h-6 text-cyan-500" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            Peak RPS (24h)
          </p>
          <p className="text-2xl font-bold font-mono text-slate-100">
            {peakRps}
          </p>
        </div>
        <div className="p-3 bg-purple-500/10 rounded-full">
          <Zap className="w-6 h-6 text-purple-500" />
        </div>
      </div>

      <div className={`bg-slate-900 border rounded-lg p-4 flex items-center justify-between transition-colors duration-300 ${isAnomaly ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-800'}`}>
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
            System Status
          </p>
          <p className={`text-xl font-bold tracking-wide ${isAnomaly ? 'text-red-500' : 'text-green-500'}`}>
            {isAnomaly ? 'UNDER ATTACK' : 'SECURE'}
          </p>
        </div>
        <div className={`p-3 rounded-full ${isAnomaly ? 'bg-red-500/10 animate-pulse' : 'bg-green-500/10'}`}>
          <ShieldAlert className={`w-6 h-6 ${isAnomaly ? 'text-red-500' : 'text-green-500'}`} />
        </div>
      </div>
    </div>
  );
};

MetricCards.propTypes = {
  currentRps: PropTypes.number.isRequired,
  peakRps: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
};

export default MetricCards;
