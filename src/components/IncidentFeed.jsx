import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, AlertTriangle } from 'lucide-react';

const IncidentFeed = ({ incidents }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-full flex flex-col">
      <h3 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">
        Incident Feed
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="bg-slate-800/50 border border-slate-700 p-3 rounded flex flex-col gap-2"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {incident.severity === 'CRITICAL' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-500'
                      : 'bg-amber-500/20 text-amber-500'
                  }`}
                >
                  {incident.severity}
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  {new Date(incident.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <span className="text-cyan-400 text-sm font-mono font-bold">
                {incident.peak_rps} RPS
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {incident.ai_explanation}
            </p>
          </div>
        ))}
        {incidents.length === 0 && (
          <div className="text-slate-500 text-center py-8 text-sm">
            No incidents recorded.
          </div>
        )}
      </div>
    </div>
  );
};

IncidentFeed.propTypes = {
  incidents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      peak_rps: PropTypes.number.isRequired,
      severity: PropTypes.oneOf(['CRITICAL', 'WARNING']).isRequired,
      ai_explanation: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default IncidentFeed;
