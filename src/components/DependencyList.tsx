import React, { useState } from 'react';
import { Dependency } from '../types';
import { Search, Filter, AlertCircle, CheckCircle, Calendar, ShieldCheck, Mail } from 'lucide-react';

interface DependencyListProps {
  dependencies: Dependency[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function DependencyList({ dependencies, selectedId, onSelect }: DependencyListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const REFERENCE_DATE = new Date("2026-06-14");

  // Helper to calculate days remaining
  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr);
    const diffTime = target.getTime() - REFERENCE_DATE.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysLabel = (dep: Dependency) => {
    if (dep.status === 'solventado') {
      return 'Sin compromisos';
    }
    const days = getDaysDiff(dep.deadlineDate);
    if (days < 0) {
      return `Vencido hace ${Math.abs(days)}d`;
    } else if (days === 0) {
      return '⚠️ Vence hoy';
    } else if (days === 1) {
      return 'Mañana es límite';
    } else {
      return `Restan ${days} días`;
    }
  };

  // Filter & Search Logic
  const filtered = dependencies.filter(dep => {
    const matchesSearch = dep.name.toLowerCase().includes(search.toLowerCase()) || 
                          dep.managerName.toLowerCase().includes(search.toLowerCase()) ||
                          dep.email.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "alerta-activa") return dep.status === "alerta-activa";
    if (filter === "vencido") return dep.status === "vencido";
    if (filter === "solventado") return dep.status === "solventado";
    if (filter === "al-corriente") return dep.status === "al-corriente";
    
    return true;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col h-full">
      {/* Header with Search */}
      <div className="p-4 bg-slate-50 border-b border-slate-200/60 space-y-3">
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" /> Registros de Dependencias
        </h3>
        
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar secretaría, encargado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex gap-1 p-2 bg-slate-50/50 border-b border-slate-200/40 overflow-x-auto scrollbar-none flex-wrap">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
            filter === "all"
              ? "bg-slate-800 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-150"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("alerta-activa")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            filter === "alerta-activa"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100/80"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Alertadas
        </button>
        <button
          onClick={() => setFilter("vencido")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            filter === "vencido"
              ? "bg-rose-600 text-white shadow-xs"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100/80"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Vencidas
        </button>
        <button
          onClick={() => setFilter("solventado")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            filter === "solventado"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-150"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Solventados
        </button>
        <button
          onClick={() => setFilter("al-corriente")}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
            filter === "al-corriente"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-blue-50 text-blue-700 hover:bg-blue-150"
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Al Corriente
        </button>
      </div>

      {/* LIST OF DEPENDENCIES */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[620px]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se encontraron dependencias que coincidan.
          </div>
        ) : (
          filtered.map((dep) => {
            const isSelected = selectedId === dep.id;
            const daysDiff = getDaysDiff(dep.deadlineDate);

            // Determine status representation colors
            let statusBadge = "";
            if (dep.status === "alerta-activa") {
              statusBadge = "bg-amber-550 border-amber-500 text-amber-700 font-semibold";
            } else if (dep.status === "vencido") {
              statusBadge = "bg-rose-50 border-rose-200 text-rose-700 font-semibold";
            } else if (dep.status === "solventado") {
              statusBadge = "bg-emerald-50 border-emerald-200 text-emerald-700";
            } else if (dep.status === "al-corriente") {
              statusBadge = "bg-blue-50 border-blue-200 text-blue-700";
            }

            return (
              <div
                key={dep.id}
                onClick={() => onSelect(dep.id)}
                className={`p-3.5 cursor-pointer border-l-4 transition-all hover:bg-slate-50 relative ${
                  isSelected 
                    ? "bg-slate-50/75 border-slate-800" 
                    : dep.status === "vencido"
                    ? "border-l-rose-500/85"
                    : dep.status === "alerta-activa"
                    ? "border-l-amber-500/85"
                    : dep.status === "solventado"
                    ? "border-l-emerald-500/60"
                    : "border-l-blue-500/60"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
                      #{String(dep.id).padStart(2, '0')}
                    </span>
                    <h4 className={`text-xs font-semibold leading-relaxed ${isSelected ? "text-slate-900 font-bold" : "text-slate-700"}`}>
                      {dep.name}
                    </h4>
                  </div>
                  
                  {/* Status Indicator Pill */}
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${statusBadge}`}>
                    {dep.status === 'alerta-activa' && 'Alerta'}
                    {dep.status === 'vencido' && 'Vencido'}
                    {dep.status === 'solventado' && 'Completo'}
                    {dep.status === 'al-corriente' && 'Al Día'}
                  </span>
                </div>

                {/* Sub row showing manager and time details */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5 max-w-[60%] truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{dep.email}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 font-medium bg-slate-50 text-slate-650 px-2 py-0.5 rounded border border-slate-100">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{getDaysLabel(dep)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
        Total en esta vista: {filtered.length} de {dependencies.length} dependencias
      </div>
    </div>
  );
}
