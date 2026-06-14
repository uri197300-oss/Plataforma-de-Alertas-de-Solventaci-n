import React from 'react';
import { Dependency } from '../types';
import { Building2, AlertTriangle, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

interface StatsBannerProps {
  dependencies: Dependency[];
}

export default function StatsBanner({ dependencies }: StatsBannerProps) {
  const total = dependencies.length;
  const activeAlerts = dependencies.filter(d => d.status === 'alerta-activa').length;
  const overdue = dependencies.filter(d => d.status === 'vencido').length;
  const solved = dependencies.filter(d => d.status === 'solventado').length;
  const clean = dependencies.filter(d => d.status === 'al-corriente').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {/* Total Card */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex items-center gap-4 hover:border-slate-300 transition-all">
        <div className="p-3 rounded-lg bg-slate-50 text-slate-700">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Dependencias</span>
          <span className="text-2xl font-bold text-slate-800">{total}</span>
        </div>
      </div>

      {/* Alriente Card */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200/80 flex items-center gap-4 hover:border-slate-300 transition-all">
        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Al Corriente</span>
          <span className="text-2xl font-bold text-blue-600">{clean}</span>
        </div>
      </div>

      {/* Active Alerts Card */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-amber-200/80 bg-amber-50/20 flex items-center gap-4 hover:border-amber-300 transition-all">
        <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-amber-500">Alertas Activas</span>
          <span className="text-2xl font-bold text-amber-600 uppercase tracking-tight">{activeAlerts}</span>
        </div>
      </div>

      {/* Overdue Card */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-rose-200/80 bg-rose-50/10 flex items-center gap-4 hover:border-rose-300 transition-all">
        <div className="p-3 rounded-lg bg-rose-100 text-rose-600">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-rose-500">Plazo Vencido</span>
          <span className="text-2xl font-bold text-rose-600">{overdue}</span>
        </div>
      </div>

      {/* Solved Card */}
      <div className="bg-white rounded-xl p-4 shadow-xs border border-emerald-200/80 bg-emerald-50/10 flex items-center gap-4 hover:border-emerald-300 transition-all">
        <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-500">Solventado</span>
          <span className="text-2xl font-bold text-emerald-600">{solved}</span>
        </div>
      </div>
    </div>
  );
}
