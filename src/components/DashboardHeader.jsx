import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle } from 'lucide-react';
import PropTypes from 'prop-types';

const DashboardHeader = ({ status }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAnomaly = status === 'ANOMALY';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="flex items-center space-x-3">
        <Activity className="w-6 h-6 text-cyan-500" />
        <h1 className="text-xl font-bold text-slate-100 tracking-wider">
          SOC Threat Monitor
        </h1>
      </div>

      <div className="flex items-center space-x-6">
        <div className="font-mono text-slate-400">
          {time.toISOString().split('T')[1].split('.')[0]} UTC
        </div>

        <div
          className={`flex items-center px-4 py-1.5 rounded-full font-bold text-sm tracking-wide transition-colors duration-300 ${
            isAnomaly
              ? 'bg-red-500/20 text-red-500 border border-red-500/50 animate-pulse'
              : 'bg-green-500/20 text-green-500 border border-green-500/50'
          }`}
        >
          {isAnomaly ? (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              ANOMALY DETECTED
            </>
          ) : (
            'NORMAL'
          )}
        </div>
      </div>
    </header>
  );
};

DashboardHeader.propTypes = {
  status: PropTypes.string.isRequired,
};

export default DashboardHeader;
