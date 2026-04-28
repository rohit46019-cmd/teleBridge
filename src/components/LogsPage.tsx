import React, { useState, useEffect } from 'react';

interface LogsPageProps {
  onClose: () => void;
}

const LogsPage: React.FC<LogsPageProps> = ({ onClose }) => {
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<any>({ 
    webhook: 'checking', 
    db: 'checking', 
    uptime: 0,
    timestamp: '' 
  });

  useEffect(() => {
    let interval: any;
    const fetchData = async () => {
      try {
        const [logsRes, healthRes] = await Promise.all([
          fetch('/api/diagnostics').catch(() => null),
          fetch('/api/health').catch(() => null)
        ]);

        if (logsRes && logsRes.ok) {
           const logData = await logsRes.json();
           setSystemLogs(Array.isArray(logData) ? logData : []);
        }

        if (healthRes && healthRes.ok) {
           const healthData = await healthRes.json();
           setStatus({
             db: healthData.dbStatus || 'unknown',
             uptime: healthData.uptime || 0,
             timestamp: healthData.timestamp || ''
           });
        } else {
           setStatus(prev => ({ ...prev, db: 'disconnected' }));
        }

      } catch (e) {}
    };

    fetchData();
    interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-bold text-sm"
          >
            <svg width={16} height={16} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">System Diagnostics</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Real-time Activity & Error Tracking</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.db === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Database: <span className={status.db === 'connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{status.db}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Logs List Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar bg-slate-100 dark:bg-slate-950/50 font-mono">
          <div className="max-w-5xl mx-auto space-y-4">
            
            {status.db !== 'connected' && (
              <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                    <svg width={24} height={24} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div>
                    <h3 className="text-rose-700 dark:text-rose-400 font-bold uppercase tracking-widest text-sm mb-1">Database Disconnected / Network Error</h3>
                    <p className="text-rose-600/80 dark:text-rose-300/80 text-xs leading-relaxed max-w-2xl">
                      The application cannot connect to the database. This means activities won't be saved and sync features will fail.
                      <br /><br />
                      <strong>Instructions:</strong>
                      <br />1. If you are on Vercel or a cloud host, ensure your <code>MONGODB_URI</code> environment variable is set correctly.
                      <br />2. If the connection string is restricted by IP, ensure your Vercel IP allows access, or set Network Access to <code>0.0.0.0/0</code> in MongoDB Atlas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {systemLogs.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <svg width={40} height={40} className="mx-auto mb-4 opacity-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <p className="font-bold uppercase tracking-widest text-xs">Waiting for activities...</p>
                <p className="text-[10px] mt-2 opacity-60">No logs captured yet since system start.</p>
              </div>
            ) : (
              systemLogs.map((log, idx) => {
                const isError = log.type === 'error';
                return (
                  <div key={idx} className={`p-5 rounded-2xl border transition-all ${isError ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-100 shadow-sm shadow-rose-500/10' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isError ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                          {isError ? <svg width={16} height={16} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> : <svg width={16} height={16} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                        </div>
                        <span className="opacity-60 text-[10px] uppercase font-bold tracking-widest">
                          {new Date(log.createdAt || log.time).toLocaleString()}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isError ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                        {log.type}
                      </span>
                    </div>
                    
                    <p className={`font-bold text-sm mb-2 ${isError ? '' : 'text-slate-900 dark:text-slate-100'}`}>{log.message}</p>
                    
                    {log.payload && (
                      <div className="mt-4">
                        {isError && (
                          <div className="mb-3 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-rose-200/50 dark:border-rose-800/30">
                            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                              <svg width={14} height={14} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg> AI Context & Instructions
                            </p>
                            <p className="text-[11px] leading-relaxed text-rose-600/90 dark:text-rose-300">
                              {log.message.includes('permission') || (typeof log.payload === 'string' && log.payload.includes('permission')) || (log.payload?.error_code === 403) ?
                                "The bot lacks admin permissions in a group. Ensure you've promoted the bot to an administrator with 'Delete Messages' capability." :
                              log.message.includes('Webhook') ?
                                "Webhook delivery failed. Ensure your bot token is correct and Vercel server is not sleeping. If Telegram cannot reach Vercel, it might suspend the webhook." :
                                "An unexpected error occurred. Review the payload exact error message."}
                            </p>
                          </div>
                        )}
                        <pre className="p-4 bg-slate-100/50 dark:bg-black/40 rounded-xl overflow-x-auto text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
                          {typeof log.payload === 'object' ? JSON.stringify(log.payload, null, 2) : log.payload}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
