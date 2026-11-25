import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { JoinEvent, TelegramGroup } from '../types.ts';
import { Icons } from '../constants.tsx';

interface JoinAnalyticsPanelProps {
  joinEvents: JoinEvent[];
  groups: TelegramGroup[];
  getISTDateKey: (ts?: number) => string;
  normalizeTimestampMs: (ts: number) => number;
  onSelectGroup?: (group: TelegramGroup) => void;
}

const JoinAnalyticsPanel: React.FC<JoinAnalyticsPanelProps> = ({
  joinEvents,
  groups,
  getISTDateKey,
  normalizeTimestampMs,
  onSelectGroup,
}) => {
  const [period, setPeriod] = useState<7 | 30>(7);

  const { chartData, totalPeriodJoins, topGrowingBatches } = useMemo(() => {
    const nowMs = Date.now();
    const dayKeys: string[] = [];
    const dayCounts: Record<string, number> = {};

    for (let i = period - 1; i >= 0; i--) {
      const key = getISTDateKey(nowMs - i * 86400000);
      dayKeys.push(key);
      dayCounts[key] = 0;
    }

    const cutoffMs = nowMs - period * 86400000;
    const batchCounts: Record<string, { chatId: string; title: string; count: number }> = {};

    for (const ev of joinEvents) {
      const ts = normalizeTimestampMs(ev.timestamp);
      const key = getISTDateKey(ts);
      if (dayCounts[key] !== undefined) {
        dayCounts[key]++;
      }
      if (ts >= cutoffMs) {
        const cid = String(ev.chatId || '');
        if (!batchCounts[cid]) {
          batchCounts[cid] = {
            chatId: cid,
            title: ev.chatTitle || `Hub ${cid}`,
            count: 0,
          };
        }
        batchCounts[cid].count++;
      }
    }

    const chartDataArr = dayKeys.map((dateStr) => {
      const [, m, d] = dateStr.split('-');
      return {
        date: dateStr,
        label: `${Number(d)}/${Number(m)}`,
        joins: dayCounts[dateStr] || 0,
      };
    });

    const total = chartDataArr.reduce((acc, item) => acc + item.joins, 0);
    const ranked = Object.values(batchCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      chartData: chartDataArr,
      totalPeriodJoins: total,
      topGrowingBatches: ranked,
    };
  }, [joinEvents, period, getISTDateKey, normalizeTimestampMs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Daily Join Trend Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-md">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
              Growth Analytics ({period} Days)
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                {totalPeriodJoins.toLocaleString()}
              </h3>
              <span className="text-[10px] font-bold text-slate-500">
                joins in last {period} days
              </span>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
            {([7, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setPeriod(days)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  period === days
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
        </div>

        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="auditJoinGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.18)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(val: any) => [`${val} joins`, 'Joins']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="joins"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#auditJoinGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Growing Batches */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-fuchsia-500">
              Top Growing Batches
            </p>
            <h3 className="text-xs font-black text-slate-900 dark:text-white mt-0.5">
              Most Active ({period}D)
            </h3>
          </div>
          <Icons.TrendingUp size={16} className="text-fuchsia-500" />
        </div>

        <div className="space-y-2.5 flex-1">
          {topGrowingBatches.length > 0 ? (
            topGrowingBatches.map((item, idx) => {
              const pct =
                totalPeriodJoins > 0
                  ? Math.round((item.count / totalPeriodJoins) * 100)
                  : 0;
              const matchedGroup = groups.find((g) => String(g.id) === String(item.chatId));
              return (
                <button
                  key={item.chatId || idx}
                  type="button"
                  onClick={() => matchedGroup && onSelectGroup?.(matchedGroup)}
                  className="w-full text-left group p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 text-xs mb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {idx + 1}. {matchedGroup?.name || item.title}
                    </span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 shrink-0 tabular-nums">
                      +{item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 6)}%` }}
                    />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center py-8 text-center text-[11px] text-slate-400">
              No join data recorded in last {period} days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinAnalyticsPanel;
