
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black border border-zinc-800 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm scroll-hide" ref={scrollRef}>
      <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
        <div className="w-3 h-3 rounded-full bg-red-600"></div>
        <span className="text-zinc-500 uppercase tracking-widest text-xs">System Analysis Log</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} className="mb-1 flex gap-3">
          <span className="text-zinc-600">[{log.timestamp}]</span>
          <span className={
            log.type === 'error' ? 'text-red-500' : 
            log.type === 'warning' ? 'text-yellow-500' : 
            log.type === 'success' ? 'text-emerald-500' : 'text-zinc-300'
          }>
            {log.type === 'success' ? '✔' : log.type === 'error' ? '✘' : '▶'} {log.message}
          </span>
        </div>
      ))}
      {logs.length === 0 && <span className="text-zinc-700 italic">Awaiting target initialization...</span>}
    </div>
  );
};
