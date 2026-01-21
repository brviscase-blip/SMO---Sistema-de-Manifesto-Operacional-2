
import React, { useMemo, useState } from 'react';
import { Manifesto } from '../types';
import { BarChart3, Clock, TrendingUp, Award, Timer, Users, Box, Zap, Calendar, Filter, ChevronRight } from 'lucide-react';
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

  // CÁLCULOS
  const atribuicaoRank = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredManifestos.forEach(m => {
      if (m.usuarioResponsavel) counts[m.usuarioResponsavel] = (counts[m.usuarioResponsavel] || 0) + 1;
    });
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
    <div className="flex flex-col gap-6 animate-fadeIn">
      
      {/* HEADER PRINCIPAL (Padrão SMO) */}
      <div className="bg-[#0f172a] border-2 border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-indigo-600 shadow-lg">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-black text-white uppercase tracking-[0.25em]">EFICIÊNCIA OPERACIONAL</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analytics Dashboard v2.5</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-slate-800 p-2 border border-slate-700">
             <div className="flex flex-col">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-1 tracking-widest">Filtrar Período</label>
                <div className="flex items-center gap-2">
                   <div className="w-32"><CustomDateTimePicker value={dateRange.start} onChange={v => setDateRange(p => ({...p, start: v}))} /></div>
                   <div className="w-4 h-[1px] bg-slate-600"></div>
                   <div className="w-32"><CustomDateTimePicker value={dateRange.end} onChange={v => setDateRange(p => ({...p, end: v}))} /></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* GRID SUPERIOR (3 Blocos) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* BLOCO 1: RANKING (4/12) */}
        <div className="lg:col-span-4 bg-white border-2 border-slate-200 panel-shadow flex flex-col overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b-2 border-slate-200 flex items-center justify-between">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Award size={14} className="text-indigo-600" /> Ranking Atribuição
            </h3>
          </div>
          <div className="p-4 flex-1 space-y-2">
            {atribuicaoRank.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase italic">Sem dados ativos</div>
            ) : (
              atribuicaoRank.map(([name, count], idx) => (
                <div key={name} className="flex items-center justify-between bg-slate-50 p-2.5 border-l-4 border-indigo-500 hover:bg-indigo-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black text-indigo-600 font-mono">#{idx+1}</span>
                    <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[150px]">{name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 font-mono-tech">{count}</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase ml-1">un</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BLOCO 2: TURNOS (4/12) */}
        <div className="lg:col-span-4 grid grid-rows-3 gap-4">
          {[
            { label: '1º TURNO (06:00 - 13:59)', count: turnStats.t1, done: turnStats.t1_e, color: 'border-blue-500' },
            { label: '2º TURNO (14:00 - 21:59)', count: turnStats.t2, done: turnStats.t2_e, color: 'border-amber-500' },
            { label: '3º TURNO (22:00 - 05:59)', count: turnStats.t3, done: turnStats.t3_e, color: 'border-indigo-600' }
          ].map((t, i) => (
            <div key={i} className={`bg-white border-2 border-slate-200 panel-shadow flex items-center justify-between px-6 border-l-8 ${t.color}`}>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.label}</p>
                <p className="text-[10px] font-bold text-slate-600 uppercase mt-1">Total Manifesto</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-900 font-mono-tech leading-none">{t.count}</p>
                <p className="text-[8px] font-black text-emerald-600 uppercase mt-1">Entregues: {t.done}</p>
              </div>
            </div>
          ))}
        </div>

        {/* BLOCO 3: SLA / LEAD TIME (4/12) */}
        <div className="lg:col-span-4 grid grid-rows-3 gap-4">
          {[
            { label: 'MANIFESTO INICIADO – RECEBIDO', val: slaStats.e, sub: 'Tempo de Espera', color: 'text-blue-600' },
            { label: 'MANIFESTO FINALIZADO – INICIADO', val: slaStats.p, sub: 'Tempo de Puxe', color: 'text-amber-600' },
            { label: 'ASSINATURA – FINALIZADO', val: slaStats.a, sub: 'Tempo Assinatura', color: 'text-emerald-600' }
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border-2 border-slate-800 panel-shadow flex flex-col justify-center px-6 items-center text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-3xl font-black font-mono-tech leading-none ${s.color}`}>{formatMinutes(s.val)}</p>
              <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 italic">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BLOCO 4: FLUXO HORA A HORA (FULL WIDTH) */}
      <div className="bg-white border-2 border-slate-200 panel-shadow overflow-hidden flex flex-col">
        <div className="bg-slate-50 px-5 py-3 border-b-2 border-slate-200 flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <Clock size={14} className="text-indigo-600" /> Manifesto Recebido Hora a Hora
          </h3>
          <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Fluxo Diário</span>
        </div>
        
        <div className="p-8 h-64 flex flex-col justify-end">
          <div className="flex-1 flex items-end gap-2 border-b-2 border-slate-100">
            {hourlyStats.map(h => (
              <div key={h.hour} className="flex-1 flex flex-col items-center group h-full justify-end">
                <div 
                  className="relative w-full max-w-[40px] flex flex-col items-center" 
                  style={{ height: `${(h.count / maxHourlyCount) * 90}%` }}
                >
                  {h.count > 0 && (
                    <span className="absolute -top-6 text-[10px] font-black text-indigo-600 font-mono-tech animate-fadeIn">
                      {h.count}
                    </span>
                  )}
                  <div className={`w-full h-full transition-all duration-500 ${h.count > 0 ? 'bg-indigo-500 group-hover:bg-indigo-700' : 'bg-slate-50 border-t border-slate-100'}`}></div>
                </div>
                <span className={`text-[9px] font-black font-mono-tech mt-3 ${h.count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                  {String(h.hour).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500"></div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Volume Recebimento</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-slate-100 border border-slate-200"></div>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Período Ocioso</span>
           </div>
        </div>
      </div>

    </div>
  );
};
