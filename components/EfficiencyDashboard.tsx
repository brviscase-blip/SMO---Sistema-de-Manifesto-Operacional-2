
import React, { useMemo, useState } from 'react';
import { Manifesto } from '../types';
import { BarChart3, Clock, Award, Timer, Box, Hourglass, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { CustomDateTimePicker } from './CustomDateTimePicker';

interface EfficiencyDashboardProps {
  manifestos: Manifesto[];
}

export const EfficiencyDashboard: React.FC<EfficiencyDashboardProps> = ({ manifestos }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    end: new Date(new Date().setHours(23, 59, 59, 999)).toISOString()
  });

  const parseAnyDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr || dateStr === '---' || dateStr === '') return null;
    try {
      const directDate = new Date(dateStr);
      if (!isNaN(directDate.getTime())) return directDate;
      const parts = dateStr.split(/[\/\s,:]+/);
      if (parts.length >= 5) {
        const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4]));
        if (!isNaN(d.getTime())) return d;
      }
      return null;
    } catch { return null; }
  };

  const filteredManifestos = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return manifestos.filter(m => {
      const mDate = parseAnyDate(m.dataHoraRecebido) || parseAnyDate(m.dataHoraPuxado);
      return mDate && mDate >= start && mDate <= end;
    });
  }, [manifestos, dateRange]);

  const formatMinutes = (min: number) => {
    if (min <= 0) return "0m";
    if (min < 60) return `${Math.round(min)}m`;
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${h}h ${m}m`;
  };

  const atribuicaoRank = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredManifestos.forEach(m => {
      if (m.usuarioResponsavel) counts[m.usuarioResponsavel] = (counts[m.usuarioResponsavel] || 0) + 1;
    });
    // Ajustado para 7 itens para garantir encaixe perfeito com fonte maior
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [filteredManifestos]);

  const turnStats = useMemo(() => {
    const turns = { t1: 0, t2: 0, t3: 0, t1_e: 0, t2_e: 0, t3_e: 0 };
    filteredManifestos.forEach(m => {
      const d = parseAnyDate(m.dataHoraRecebido);
      if (!d) return;
      const hour = d.getHours();
      const isEntregue = m.status === 'Manifesto Entregue';
      if (hour >= 6 && hour < 14) { turns.t1++; if (isEntregue) turns.t1_e++; }
      else if (hour >= 14 && hour < 22) { turns.t2++; if (isEntregue) turns.t2_e++; }
      else { turns.t3++; if (isEntregue) turns.t3_e++; }
    });
    return turns;
  }, [filteredManifestos]);

  const slaStats = useMemo(() => {
    let tE = 0, cE = 0, tP = 0, cP = 0, tA = 0, cA = 0;
    filteredManifestos.forEach(m => {
      const rec = parseAnyDate(m.dataHoraRecebido);
      const ini = parseAnyDate(m.dataHoraIniciado);
      const com = parseAnyDate(m.dataHoraCompleto);
      const ass = parseAnyDate(m.dataHoraRepresentanteCIA);
      if (rec && ini) { tE += (ini.getTime() - rec.getTime()) / 60000; cE++; }
      if (ini && com) { tP += (com.getTime() - ini.getTime()) / 60000; cP++; }
      if (com && ass) { tA += (ass.getTime() - com.getTime()) / 60000; cA++; }
    });
    return { e: cE > 0 ? tE / cE : 0, p: cP > 0 ? tP / cP : 0, a: cA > 0 ? tA / cA : 0 };
  }, [filteredManifestos]);

  const hourlyStats = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hours[i] = 0;
    filteredManifestos.forEach(m => {
      const d = parseAnyDate(m.dataHoraRecebido);
      if (d) hours[d.getHours()]++;
    });
    return Object.entries(hours).map(([h, count]) => ({ hour: parseInt(h), count }));
  }, [filteredManifestos]);

  const maxHourlyCount = Math.max(...hourlyStats.map(h => h.count), 1);

  return (
    <div className="flex flex-col gap-4 animate-fadeIn h-[calc(100vh-100px)] overflow-hidden">
      
      {/* HEADER PRINCIPAL - Compactado */}
      <div className="bg-[#0f172a] border-2 border-slate-800 p-3 px-5 flex flex-col md:flex-row items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-600 shadow-lg">
            <BarChart3 size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em] leading-none">EFICIÊNCIA OPERACIONAL</h2>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Analytics Dashboard v2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 bg-slate-800 p-1 border border-slate-700">
               <div className="w-28"><CustomDateTimePicker value={dateRange.start} onChange={v => setDateRange(p => ({...p, start: v}))} /></div>
               <div className="w-28"><CustomDateTimePicker value={dateRange.end} onChange={v => setDateRange(p => ({...p, end: v}))} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID SUPERIOR - Altura fixa controlada */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 shrink-0 h-[300px]">
        
        {/* BLOCO 1: RANKING ATRIBUIÇÃO (FONTE +20% E COMPACTADO) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 panel-shadow flex flex-col overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b-2 border-slate-200 flex items-center justify-between shrink-0">
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Award size={12} className="text-indigo-600" /> Ranking Atribuição
            </h3>
          </div>
          <div className="flex-1 overflow-hidden p-1.5 space-y-0.5">
            {atribuicaoRank.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-300 text-[9px] font-bold uppercase italic">Sem dados ativos</div>
            ) : (
              atribuicaoRank.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between bg-slate-50/50 py-1.5 px-3 border-l-4 border-indigo-500">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[13px] font-black text-indigo-600 font-mono shrink-0">#{idx+1}</span>
                    <span className="text-[13px] font-black text-slate-700 uppercase truncate">{name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[14px] font-black text-slate-900 font-mono-tech">{count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BLOCO 2: PERFORMANCE POR TURNO */}
        <div className="lg:col-span-4 grid grid-rows-3 gap-2">
          {[
            { label: '1º TURNO', count: turnStats.t1, done: turnStats.t1_e, color: 'border-blue-500' },
            { label: '2º TURNO', count: turnStats.t2, done: turnStats.t2_e, color: 'border-amber-500' },
            { label: '3º TURNO', count: turnStats.t3, done: turnStats.t3_e, color: 'border-indigo-600' }
          ].map((t, i) => (
            <div key={i} className={`bg-white border-2 border-slate-200 panel-shadow flex items-center justify-between px-6 border-l-4 ${t.color}`}>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.label}</p>
                <p className="text-[12px] font-bold text-slate-600 uppercase mt-1">Manifestos</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 font-mono-tech leading-none">{t.count}</p>
                <p className="text-[8px] font-black text-emerald-600 uppercase mt-0.5">Concluídos: {t.done}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BLOCO 3: SLA / LEAD TIME */}
        <div className="lg:col-span-4 grid grid-rows-3 gap-2">
          {[
            { label: 'ESPERA', val: slaStats.e, icon: Hourglass, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'PROCESSAMENTO', val: slaStats.p, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'LIBERAÇÃO', val: slaStats.a, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' }
          ].map((s, i) => (
            <div key={i} className={`bg-white border-2 border-slate-200 panel-shadow flex items-center overflow-hidden`}>
              <div className={`w-12 h-full flex items-center justify-center ${s.bg} border-r border-slate-100`}>
                 <s.icon size={18} className={s.color} />
              </div>
              <div className="flex-1 px-4 py-2">
                 <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">{s.label}</p>
                    <p className={`text-2xl font-black font-mono-tech leading-none ${s.color}`}>{formatMinutes(s.val)}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BLOCO 4: FLUXO HORA A HORA - Altura Dinâmica */}
      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="bg-slate-50 px-5 py-2 border-b-2 border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
             <Clock size={14} className="text-indigo-600" />
             <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Fluxo Operacional de Recebimento</h3>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 shadow-sm">Dashboard Compact View</span>
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col justify-end bg-white relative overflow-hidden">
          <div className="absolute inset-x-8 bottom-[52px] top-6 flex flex-col justify-between pointer-events-none opacity-[0.03]">
             {[1,2,3,4].map(i => <div key={i} className="w-full h-px bg-slate-900"></div>)}
          </div>

          <div className="flex-1 flex items-end gap-2 border-b-2 border-slate-200 relative z-10 pb-2">
            {hourlyStats.map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center group h-full justify-end">
                <div 
                  className="relative w-full max-w-[40px] flex flex-col items-center" 
                  style={{ height: `${(h.count / maxHourlyCount) * 92}%` }}
                >
                  {h.count > 0 && (
                    <div className="absolute -top-6 flex flex-col items-center animate-fadeIn">
                       <span className="text-[10px] font-black text-indigo-600 font-mono-tech">
                        {h.count}
                       </span>
                    </div>
                  )}
                  <div className={`w-full h-full transition-all duration-700 ease-out shadow-sm rounded-t-sm ${h.count > 0 ? 'bg-indigo-500 group-hover:bg-indigo-700' : 'bg-slate-50'}`}></div>
                </div>
                <span className={`text-[9px] font-black font-mono-tech mt-2 ${h.count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                  {String(h.hour).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-indigo-500 shadow-sm rounded-sm"></div>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Recebimento</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 bg-white border border-slate-200 rounded-sm"></div>
                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Inativo</span>
              </div>
           </div>
           <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-widest">Sincronização Ativa v2.5</p>
        </div>
      </div>

    </div>
  );
};
