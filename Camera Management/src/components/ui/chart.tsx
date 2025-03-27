
import React from 'react';
import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

type ChartData = {
  name: string;
  [key: string]: any;
};

interface ChartProps {
  data: ChartData[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  showLegend?: boolean;
  height?: number;
}

export const AreaChart = ({
  data,
  index,
  categories,
  colors = ['#3b82f6'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  height = 300,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={index} />
        <YAxis />
        <Tooltip formatter={(value) => [valueFormatter(Number(value)), ''] as [string, string]} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Area
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};

export const BarChart = ({
  data,
  index,
  categories,
  colors = ['#3b82f6'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  height = 300,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={index} />
        <YAxis />
        <Tooltip formatter={(value) => [valueFormatter(Number(value)), ''] as [string, string]} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[i % colors.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export const LineChart = ({
  data,
  index,
  categories,
  colors = ['#3b82f6'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  height = 300,
}: ChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey={index} />
        <YAxis />
        <Tooltip formatter={(value) => [valueFormatter(Number(value)), ''] as [string, string]} />
        {showLegend && <Legend />}
        {categories.map((category, i) => (
          <Line
            key={category}
            type="monotone"
            dataKey={category}
            stroke={colors[i % colors.length]}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};
