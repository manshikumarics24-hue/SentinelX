import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import PropTypes from 'prop-types';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-lg">
        <p className="text-slate-400 text-xs mb-1 font-mono">
          {new Date(label).toLocaleTimeString()}
        </p>
        <p className="text-cyan-400 font-bold font-mono">
          {payload[0].value} RPS
        </p>
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
};

const LiveRpsChart = ({ data }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 h-64 w-full">
      <h3 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">
        Live Traffic (RPS)
      </h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              stroke="#475569"
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'monospace' }}
              minTickGap={30}
            />
            <YAxis
              domain={[0, 150]}
              stroke="#475569"
              tick={{ fill: '#475569', fontSize: 12, fontFamily: 'monospace' }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="current_rps"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

LiveRpsChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      current_rps: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default LiveRpsChart;
