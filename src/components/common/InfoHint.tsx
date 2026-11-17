import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface InfoHintProps {
  title: string;
  description: string;
  example?: string;
}

export const InfoHint: React.FC<InfoHintProps> = ({ title, description, example }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="rounded p-0 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors focus:outline-none"
        title={title}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 border border-slate-700 text-xs font-sans text-slate-200 pointer-events-none">
          <div className="font-bold text-cyan-300 font-mono mb-1 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>{title}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">{description}</p>
          {example && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-amber-300/90 font-mono">
              {example}
            </div>
          )}
          <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-slate-700" />
        </div>
      )}
    </div>
  );
};
