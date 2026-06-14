import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Search, 
  Filter, 
  Mail, 
  Calendar, 
  User, 
  FileText, 
  Trash2, 
  Plus, 
  Wand2, 
  Send, 
  Check, 
  HelpCircle, 
  RefreshCw, 
  History, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  Terminal,
  Database,
  Info
} from 'lucide-react';
import { Dependency, EmailLog } from './types';
import { INITIAL_DEPENDENCIES } from './data/defaults';
import * as dbService from './lib/dbService';

export default function App() {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('alert_admin_auth') === 'true';
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(1); // Default to SEGOB
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Tab state for Right panel (AI Alert Generator vs. Sent History logs)
  const [rightTab, setRightTab] = useState<'editor' | 'history'>('editor');

  // Search and Filter states for left list
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dependency Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formAlert, setFormAlert] = useState('');
  const [formStatus, setFormStatus] = useState<Dependency['status']>('al-corriente');
  const [formObservations, setFormObservations] = useState<string[]>([]);
  const [newObservation, setNewObservation] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // New Dependency Registration form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regManager, setRegManager] = useState('');
  const [regDeadline, setRegDeadline] = useState('2026-07-15');
  const [regAlert, setRegAlert] = useState('2026-07-01');
  const [regStatus, setRegStatus] = useState<Dependency['status']>('al-corriente');
  const [isRegistering, setIsRegistering] = useState(false);

  // AI Generator Form state
  const [aiTone, setAiTone] = useState<'cordial' | 'urgente' | 'formal-enérgico' | 'último-aviso'>('formal-enérgico');
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [senderName, setSenderName] = useState('Donají Razo (DGCH)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Drafted email preview state
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');

  // Sending SMTP simulation state
  const [isSending, setIsSending] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [activeConsoleIndex, setActiveConsoleIndex] = useState(-1);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  // Success toast/message state
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Today reference is 2026-06-14
  const REFERENCE_DATE = new Date("2026-06-14");

  // Fetch initial data
  const fetchData = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const dataDeps = await dbService.getDependencies();
      setDependencies(dataDeps);

      const dataLogs = await dbService.getEmailLogs();
      setEmailLogs(dataLogs);

      if (showToast) {
        showGlobalToast('success', 'Base de datos sincronizada con éxito');
      }
    } catch (err) {
      console.error(err);
      showGlobalToast('error', 'Error de conexión con el servidor administrativo');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Form fields whenever active dependency changes
  const activeDep = dependencies.find(d => d.id === selectedId) || null;

  useEffect(() => {
    if (activeDep) {
      setFormName(activeDep.name);
      setFormEmail(activeDep.email);
      setFormManager(activeDep.managerName);
      setFormDeadline(activeDep.deadlineDate);
      setFormAlert(activeDep.alertDate);
      setFormStatus(activeDep.status);
      setFormObservations(activeDep.observations || []);
      // Reset AI checkboxes to include all observations by default
      setSelectedObservations(activeDep.observations || []);
      // Clears previous drafts to avoid mismatch
      setDraftSubject('');
      setDraftBody('');
      setConsoleLogs([]);
    }
  }, [selectedId, activeDep]);

  // Toast helper
  const showGlobalToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctEmail = 'Uri197300@gmail.com';
    const correctPassword = '#DGCH2026_Alertas';

    if (loginEmail.trim().toLowerCase() === correctEmail.toLowerCase() && loginPassword === correctPassword) {
      setIsAdmin(true);
      localStorage.setItem('alert_admin_auth', 'true');
      setLoginError(null);
      showGlobalToast('success', 'Sesión iniciada con éxito en el Departamento de Innovación Administrativa');
    } else {
      setLoginError('El correo electrónico o la contraseña no coinciden con los registros autorizados.');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('alert_admin_auth');
    setLoginEmail('');
    setLoginPassword('');
    showGlobalToast('info', 'Sesión de administración finalizada.');
  };

  // Days remaining calculation
  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr);
    const diffTime = target.getTime() - REFERENCE_DATE.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper labels
  const getDaysLabel = (dep: Dependency) => {
    if (dep.status === 'solventado') {
      return 'Sin compromisos pendientes';
    }
    const days = getDaysDiff(dep.deadlineDate);
    if (days < 0) {
      return `Plazo vencido hace ${Math.abs(days)}d`;
    } else if (days === 0) {
      return '⚠️ VENCE HOY';
    } else if (days === 1) {
      return '⚠️ Vence Mañana';
    } else {
      return `Faltan ${days} días`;
    }
  };

  // Save changes to active dependency
  const handleSaveDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    try {
      setIsSaving(true);
      const payload = {
        name: formName,
        email: formEmail,
        managerName: formManager,
        deadlineDate: formDeadline,
        alertDate: formAlert,
        status: formStatus,
        observations: formObservations
      };

      const updated = await dbService.saveDependency(selectedId, payload);
      showGlobalToast('success', 'Cambios guardados con éxito');
      // Update local list state
      setDependencies(prev => prev.map(d => d.id === selectedId ? updated : d));
    } catch (err: any) {
      showGlobalToast('error', err.message || 'Error en el guardado de parámetros');
    } finally {
      setIsSaving(false);
    }
  };

  // Create / Register a new dependency manually
  const handleCreateDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regManager.trim()) {
      showGlobalToast('error', 'Por favor llena todos los campos obligatorios.');
      return;
    }
    try {
      setIsRegistering(true);
      const payload = {
        name: regName.trim(),
        email: regEmail.trim(),
        managerName: regManager.trim(),
        deadlineDate: regDeadline,
        alertDate: regAlert,
        status: regStatus,
        observations: []
      };

      const newDep = await dbService.createDependency(payload);
      showGlobalToast('success', `Dependencia "${newDep.name}" registrada con éxito.`);
      setDependencies(prev => [...prev, newDep]);
      setSelectedId(newDep.id);
      // Reset registration fields
      setRegName('');
      setRegEmail('');
      setRegManager('');
      setRegDeadline('2026-07-15');
      setRegAlert('2026-07-01');
      setRegStatus('al-corriente');
      setShowRegisterForm(false);
    } catch (err: any) {
      showGlobalToast('error', err.message || 'Fallo al procesar el registro.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Delete current dependency
  const handleDeleteDependency = async (depId: number) => {
    const depToDelete = dependencies.find(d => d.id === depId);
    if (!depToDelete) return;
    if (!window.confirm(`¿Está seguro de eliminar de forma permanente el registro de "${depToDelete.name}"?`)) {
      return;
    }

    try {
      await dbService.deleteDependency(depId);
      showGlobalToast('info', `Registro "${depToDelete.name}" eliminado.`);
      const remaining = dependencies.filter(d => d.id !== depId);
      setDependencies(remaining);
      // Select first available dependency if exists
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
      }
    } catch (err: any) {
      showGlobalToast('error', err.message || 'Error en la eliminación del registro.');
    }
  };

  // Wipe dependencies completely clean
  const handleClearAllDependencies = async () => {
    if (!window.confirm('⚠️ ADVERTENCIA CRÍTICA: ¿Está absolutamente seguro de borrar todos los registros de dependencias? Esto dejará la base de datos completamente limpia para que los llene manualmente de forma personalizada.')) {
      return;
    }
    try {
      setIsRefreshing(true);
      await dbService.clearDependencies();
      setDependencies([]);
      setSelectedId(null);
      showGlobalToast('info', 'Base de datos vaciada con éxito. Listo para ingresos manuales.');
    } catch (err: any) {
      showGlobalToast('error', err.message || 'Fallo en la comunicación.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add observation key-value
  const handleAddObservation = () => {
    if (!newObservation.trim()) return;
    const updated = [...formObservations, newObservation.trim()];
    setFormObservations(updated);
    setSelectedObservations(updated); // auto select for email also
    setNewObservation('');
  };

  // Remove observation item
  const handleRemoveObservation = (indexToRemove: number) => {
    const updated = formObservations.filter((_, idx) => idx !== indexToRemove);
    setFormObservations(updated);
    setSelectedObservations(prev => prev.filter(obs => updated.includes(obs)));
  };

  // Reset entire Database to initial values
  const handleResetDatabase = async () => {
    if (!window.confirm('¿Está seguro de restaurar toda la base de datos a sus valores iniciales predeterminados? Se perderán las modificaciones de fechas, correos e historial.')) {
      return;
    }
    try {
      setIsRefreshing(true);
      const data = await dbService.resetDependencies(INITIAL_DEPENDENCIES);
      setDependencies(data);
      setSelectedId(1);
      showGlobalToast('info', 'Parámetros restablecidos al estado de auditoría original');
      // Clear logs too
      await dbService.clearEmailLogs();
      setEmailLogs([]);
    } catch (err: any) {
      showGlobalToast('error', err.message || 'Error de restauración');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Clear email delivery logs
  const handleClearLogs = async () => {
    try {
      await dbService.clearEmailLogs();
      setEmailLogs([]);
      showGlobalToast('info', 'Historial de despacho de alertas vaciado.');
    } catch (err: any) {
      showGlobalToast('error', err.message || 'No se pudo vaciar el historial.');
    }
  };

  // AI Generation of professional email templates
  const handleGenerateAIEmail = async () => {
    if (!selectedId || !activeDep) return;
    setIsGenerating(true);
    setAiError(null);
    setDraftSubject('');
    setDraftBody('');

    try {
      const generated = await dbService.generateAIAlertEmail({
        dependencyId: selectedId,
        dependencyName: activeDep.name,
        managerName: formManager || activeDep.managerName,
        deadlineDate: formDeadline || activeDep.deadlineDate,
        tone: aiTone,
        observationsToInclude: selectedObservations,
        additionalNotes: additionalNotes,
        senderName: senderName
      });

      setDraftSubject(generated.subject || `Oficio Alerta de Solventación - ${activeDep?.name}`);
      setDraftBody(generated.body || '');
      showGlobalToast('success', 'Borrador de Alerta Gubernamental redactado por IA.');
    } catch (err: any) {
      setAiError(err.message || 'Error de comunicación con el generador');
      generateMockAIFallback();
      showGlobalToast('info', 'Se aplicó la plantilla de respaldo formal.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Elegant fallback template generator matching professional Mexican audit tone
  const generateMockAIFallback = () => {
    if (!activeDep) return;
    
    let toneTitle = "ALERTA URGENTE DE TRÁMITE DE SOLVENTACIÓN";
    let entryText = "Por medio de la presente, se hace de su superior conocimiento que se ha detectado el vencimiento inminente de los términos legales otorgados...";
    let legalAct = "De conformidad con el Artículo 49 y 50 de la Ley General de Responsabilidades Administrativas de nuestro Estado, le exhortamos...";

    if (aiTone === 'cordial') {
      toneTitle = "OFICIO RECORDATORIO - SOLVENTACIÓN DE OBSERVACIONES PENDIENTES";
      entryText = "Le enviamos un cordial saludo, al tiempo que le recordamos de manera atenta la importancia de dar continuidad a la solventación de las observaciones...";
      legalAct = "Confiamos plenamente en su compromiso de transparencia institucional para agilizar los canales técnicos antes de la fecha programada...";
    } else if (aiTone === 'urgente') {
      toneTitle = "REQUERIMIENTO INMEDIATO - ALERTA ALTA DE PLAZO ADMINISTRATIVO";
      entryText = "Nos dirigimos a usted con carácter prioritario. De la revisión de nuestro sistema central de control interno, se observa el estatus NO SOLVENTADO para su área...";
      legalAct = "Debido a la cercanía jurídica del término fijado, solicitamos su intervención inmediata para evitar la integración de un expediente formal de presunta responsabilidad administrativa.";
    } else if (aiTone === 'último-aviso') {
      toneTitle = "ÚLTIMO AVISO DE VENCIMIENTO - APERCIBIMIENTO FORMAL E IMPRORROGABLE";
      entryText = "Sirva el presente como el último apercibimiento administrativo para solventar las observaciones detalladas. Se ha agotado el margen ordinario de plazos...";
      legalAct = "De no contar con las actas y bitácoras de solventación digitalizadas en el sistema oficial a más tardar el día laboral límite, se procederá a turnar el caso ante la Auditoría Superior del Estado y al Órgano Interno de Control para los procedimientos de sanción correspondientes de ley.";
    }

    const obsText = selectedObservations.length > 0
      ? selectedObservations.map((o, i) => `  ${i + 1}. OBSERVACIÓN PENDIENTE: ${o}`).join('\n\n')
      : "  1. Falta de integración documental y comprobantes del ejercicio de recursos asignados.";

    const mockSubject = `ASUNTO: [${toneTitle}] - ${activeDep.name.toUpperCase()}`;
    const mockBody = `ESTABLECIMIENTO DEL PLIEGO DE OBSERVACIONES DE AUDITORÍA
GOBIERNO DEL ESTADO - DIRECCIÓN DE VIGILANCIA Y CONTROL

Para: ${formManager || activeDep.managerName}
Dependencia: ${activeDep.name}
Correo Electrónico de Enlace: ${formEmail || activeDep.email}
Fecha de Emisión: 14 de Junio de 2026 (Tiempo de Auditoría)

Estimado(a) Titular,

${entryText}

Por lo anterior, se detallan a continuación las irregularidades u observaciones sustantivas que requieren atención inmediata y que debieron o deberán alertarse antes del ${formAlert || activeDep.alertDate}:

${obsText}

Esta Dirección General ha determinado establecer como fecha definitiva e improrrogable para la solventación integral el día:
👉 FECHA LÍMITE: ${formDeadline || activeDep.deadlineDate} (Restan ${getDaysDiff(formDeadline || activeDep.deadlineDate)} días naturales).

${legalAct}

Agradeciendo de antemano su pronta atención a este llamado de urgencia.

Atentamente,
${senderName || 'Departamento de Innovación Administrativa'}
DGCH, Órgano de Fiscalización Estatal.`;

    setDraftSubject(mockSubject);
    setDraftBody(mockBody);
  };

  // Submit/Send email with dynamic retro-terminal simulation logs
  const handleSendNotification = async () => {
    if (!activeDep || !draftSubject || !draftBody) return;

    setIsSending(true);
    setConsoleLogs([]);
    setActiveConsoleIndex(0);

    const steps = [
      `[1/8] 📡 Conectando con el Servidor Remoto SMTP Estatal (smtp.estado.gob.mx:587)...`,
      `[2/8] 🔐 Estableciendo túnel de cifrado avanzado bajo protocolo seguro TLSv1.3...`,
      `[3/8] 🆔 Autenticando credenciales oficiales del Departamento de Innovación Administrativa: [${senderName}]... OK`,
      `[4/8] 🔍 Verificando dirección gubernamental de enlace en activo: <${formEmail || activeDep.email}>... OK`,
      `[5/8] 📝 Estructurando cabeceras oficiales, codificación UTF-8 e inyección de expediente #${String(activeDep.id).padStart(2, '0')}...`,
      `[6/8] 🚀 Transmitiendo paquete de alerta (Tamaño: ${(draftBody.length/1024).toFixed(2)} KB)...`,
      `[7/8] ⏳ Esperando confirmación remota del gateway de correos para dependencias... Encolado exitoso`,
      `[8/8] 📬 Sincronización Completa. Mensaje despachado con éxito. ID de Entrega: ASE-${Math.random().toString(36).substring(3, 9).toUpperCase()}`
    ];

    try {
      const result = await dbService.sendAndLogEmail(
        activeDep.id,
        activeDep.name,
        formEmail || activeDep.email,
        draftSubject,
        draftBody,
        senderName
      );
      
      // Simulate live ticking on terminal
      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 320));
        setConsoleLogs(prev => [...prev, steps[i]]);
        if (consoleBottomRef.current) {
          consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }

      if (result.success) {
        showGlobalToast('success', `Alerta despachada exitosamente a ${activeDep.name}`);
        const updatedLogs = await dbService.getEmailLogs();
        setEmailLogs(updatedLogs);
      }
    } catch (err: any) {
      setConsoleLogs(prev => [...prev, "❌ ERROR CRÍTICO EN EL TRANSPORTE DE ENVÍO. Gateway fuera de línea."]);
      showGlobalToast('error', err.message || 'Fallo al transmitir la notificación.');
    } finally {
      setIsSending(false);
    }
  };

  // Search filter applied to the left list
  const filteredDependencies = dependencies.filter(dep => {
    const matchesSearch = 
      dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    return dep.status === statusFilter;
  });

  // Derived metrics for the key ribbon
  const totalCount = dependencies.length;
  const activeAlertsCount = dependencies.filter(d => d.status === 'alerta-activa').length;
  const overdueCount = dependencies.filter(d => d.status === 'vencido').length;
  const solvedCount = dependencies.filter(d => d.status === 'solventado').length;
  const alCorrienteCount = dependencies.filter(d => d.status === 'al-corriente').length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative font-sans overflow-y-auto select-none">
        
        {/* Background visual abstract lights */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
          
          {/* Header shield icon */}
          <div className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">DEPARTAMENTO DE INNOVACIÓN ADMINISTRATIVA</h2>
              <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mt-1">DGCH</p>
            </div>
            <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-amber-500/45 to-transparent"></div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-6 text-xs text-slate-300 space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-wider text-[10px] mb-1">
              <Info className="w-3.5 h-3.5" />
              <span>Acceso Restringido - Alertas Gubernamentales</span>
            </div>
            <p>Esta plataforma gestiona pliegos de observaciones, fechas críticas de vencimiento y despacho automatizado de apercibimientos oficiales asistidos por Inteligencia Artificial.</p>
            <p className="text-[11px] text-slate-400 italic">Inicie sesión con las credenciales de Auditor Administrador autorizadas para proceder.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg font-medium">
                {loginError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-450 tracking-wider block">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo@estado.gob.mx"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-hidden focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-450 tracking-wider block">
                Clave de Despacho Auditor
              </label>
              <div className="relative">
                <Terminal className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="•••••••••••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-lg focus:outline-hidden focus:border-indigo-500 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-normal uppercase text-xs py-3 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Autenticar y Sincronizar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick instructions hints */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 text-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Firma Digital Encriptada v2.4
            </span>
          </div>

        </div>

        {/* Outer credit */}
        <p className="mt-6 text-[10px] text-slate-650 font-mono">
          Gobierno del Estado • Dirección de Cuenta Pública y Fiscalización
        </p>

      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 flex-shrink-0 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-500 p-1.5 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Plataforma de Alertas de Solventación
              <span className="bg-indigo-900 text-indigo-300 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-indigo-700/50">
                Departamento de Innovación Administrativa
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Gestión Gubernamental del Estado</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-800 text-slate-400 font-mono px-2.5 py-1 rounded-md text-[11px] border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>Auditoría Virtual Activa</span>
          </div>
          
          <button 
            onClick={() => fetchData(true)}
            className="p-1 px-2.5 hover:bg-slate-800 rounded-md border border-slate-700 cursor-pointer text-slate-300 transition-colors flex items-center gap-1.5 text-[11px]"
            title="Refrescar base de datos"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>

          <div className="h-6 w-px bg-slate-700"></div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="block font-semibold text-slate-200">Donají Razo</span>
              <span className="block text-[10px] text-slate-400">DGCH</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-600 border-2 border-slate-700 flex items-center justify-center text-xs text-white font-bold tracking-wider select-none">
              DR
            </div>
            
            <button 
              onClick={handleLogout}
              className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 hover:bg-rose-900 border border-slate-700 hover:border-rose-950 transition-colors px-2.5 py-1.5 rounded-md cursor-pointer text-slate-300 hover:text-white"
              title="Cerrar la sesión de auditoría"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* 2. KEY METRICS RIBBON (High Density style with precise statistics) */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between flex-shrink-0 gap-4">
        <div className="flex items-center space-x-8">
          
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">Dependencias</span>
            <span className="text-md font-mono font-bold text-slate-800 flex items-center gap-1.5 leading-none mt-1">
              {totalCount} <span className="text-xs font-sans font-normal text-slate-400">registradas</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-amber-500 tracking-widest">Alertas Activas</span>
            <span className="text-md font-mono font-bold text-amber-600 flex items-center gap-1 leading-none mt-1">
              <AlertTriangle className="w-4 h-4 text-amber-500 inline shrink-0" />
              {String(activeAlertsCount).padStart(2, '0')}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-rose-500 tracking-widest">Plazo Vencido</span>
            <span className="text-md font-mono font-bold text-rose-600 flex items-center gap-1 leading-none mt-1">
              <Clock className="w-4 h-4 text-rose-500 inline shrink-0" />
              {String(overdueCount).padStart(2, '0')}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-emerald-500 tracking-widest">Solventado</span>
            <span className="text-md font-mono font-bold text-emerald-600 flex items-center gap-1 leading-none mt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 inline shrink-0" />
              {String(solvedCount).padStart(2, '0')}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200"></div>

          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-blue-500 tracking-widest">Al Corriente</span>
            <span className="text-md font-mono font-bold text-blue-600 flex items-center gap-1 leading-none mt-1">
              <ShieldCheck className="w-4 h-4 text-blue-500 inline shrink-0" />
              {String(alCorrienteCount).padStart(2, '0')}
            </span>
          </div>

        </div>

        <div className="flex items-center space-x-3">
          {/* Quick Info Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Fecha del Sistema: <b>14 de Junio de 2026</b></span>
          </div>

          <button 
            onClick={handleResetDatabase}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 cursor-pointer transition-colors flex items-center gap-1.5"
            title="Sintetizar base de datos original"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            Restablecer Valores
          </button>
        </div>
      </div>

      {/* GLOBAL NOTIFICATION TOAST */}
      {toastMessage && (
        <div className={`mx-6 mt-3 px-4 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between border shadow-sm transition-all animate-slideDown ${
          toastMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toastMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)} 
            className="text-[10px] uppercase font-bold tracking-wider hover:opacity-70 px-2 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* 3. MAIN DASHBOARD SPLIT AREA (High Density Grid) */}
      <main className="flex-1 p-4 grid grid-cols-12 gap-4 overflow-hidden min-h-0">
        
        {/* COLUMN A: LEFT LIST OF DEPENDENCIES (cols: 4/12) */}
        <section className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col h-full overflow-hidden min-h-0">
          
          {/* Search Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col gap-2 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Dependencias Públicas</h2>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-semibold">
                {filteredDependencies.length} / {dependencies.length} de {totalCount}
              </span>
            </div>

            {/* Quick Actions for Manual Registry and Database Wipe */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRegisterForm(true)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                title="Registrar manualmente una nueva dependencia gubernamental"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Dependencia
              </button>
              <button
                onClick={handleClearAllDependencies}
                className="bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 border border-rose-200 font-bold text-[10px] uppercase tracking-wider py-1.5 px-2.5 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Borrar todos los registros para empezar de cero"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpiar Todo
              </button>
            </div>

            {/* Combined Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar secretaría, enlace o titular..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-white pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Mini filters buttons bar for High Density density feel */}
          <div className="flex gap-1 p-2 bg-slate-50/50 border-b border-slate-200 overflow-x-auto scrollbar-thin whitespace-nowrap shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Toda
            </button>
            <button
              onClick={() => setStatusFilter('alerta-activa')}
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'alerta-activa'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/50 hover:bg-amber-100'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-amber-400 inline-block animate-ping"></span> Alertadas
            </button>
            <button
              onClick={() => setStatusFilter('vencido')}
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'vencido'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-rose-500 inline-block"></span> Vencidas
            </button>
            <button
              onClick={() => setStatusFilter('solventado')}
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'solventado'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100'
              }`}
            >
              Solventadas
            </button>
            <button
              onClick={() => setStatusFilter('al-corriente')}
              className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'al-corriente'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-50 text-blue-700 border border-blue-200/50 hover:bg-blue-105'
              }`}
            >
              Al Día
            </button>
          </div>

          {/* List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
            {filteredDependencies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <Search className="w-8 h-8 text-slate-200" />
                <span>Ningún resultado coincide con los criterios</span>
              </div>
            ) : (
              filteredDependencies.map(dep => {
                const isSelected = selectedId === dep.id;
                const daysRemaining = getDaysDiff(dep.deadlineDate);

                // Determine dynamic status coloring
                let rowBgColor = '';
                if (isSelected) {
                  rowBgColor = 'bg-slate-100/80 border-indigo-600';
                }

                let badgeColor = '';
                if (dep.status === 'vencido') {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                } else if (dep.status === 'alerta-activa') {
                  badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                } else if (dep.status === 'solventado') {
                  badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                } else {
                  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                }

                return (
                  <div
                    key={dep.id}
                    onClick={() => {
                      setSelectedId(dep.id);
                      setRightTab('editor'); // Switch tab back to Editor to make it intuitive
                    }}
                    className={`p-3 cursor-pointer border-l-4 transition-all hover:bg-slate-50 flex flex-col justify-between select-none ${
                      isSelected 
                        ? 'bg-slate-50/90 border-l-indigo-600' 
                        : dep.status === 'vencido'
                        ? 'border-l-rose-500'
                        : dep.status === 'alerta-activa'
                        ? 'border-l-amber-500'
                        : dep.status === 'solventado'
                        ? 'border-l-emerald-500'
                        : 'border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1 py-0.1 select-none border border-slate-200 rounded">
                            {String(dep.id).padStart(2, '0')}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 capitalize inline-block max-w-[130px] truncate">
                            {dep.managerName.split(' ')[0] || 'Enlace'} {dep.managerName.split(' ')[1] || ''}
                          </span>
                        </div>
                        <h4 className={`text-xs font-semibold leading-snug tracking-tight ${
                          isSelected ? 'text-slate-900 font-bold' : 'text-slate-700'
                        }`}>
                          {dep.name}
                        </h4>
                      </div>

                      {/* Status pill */}
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0 ${badgeColor}`}>
                        {dep.status === 'alerta-activa' && 'Alerta'}
                        {dep.status === 'vencido' && 'Vencido'}
                        {dep.status === 'solventado' && 'Completo'}
                        {dep.status === 'al-corriente' && 'Al Día'}
                      </span>
                    </div>

                    {/* Secondary details with email and remaining time alert */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-[10px] italic max-w-[55%] truncate">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{dep.email}</span>
                      </span>

                      <span className="flex items-center gap-1 font-semibold text-[10px] bg-slate-100/90 py-0.5 px-1.5 rounded border border-slate-200 text-slate-700 shrink-0">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {getDaysLabel(dep)}
                      </span>
                    </div>

                    {/* Observations count badge if high density has items */}
                    {dep.observations && dep.observations.length > 0 && (
                      <div className="mt-1.5 pt-1 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-[9px] text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span><b>{dep.observations.length}</b> observaciones pendientes de solventar</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono">
                          Alerta: {dep.alertDate}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 flex justify-between items-center font-mono flex-shrink-0">
            <span>Servidor Central Estado</span>
            <span>Estable: 200 OK</span>
          </div>
        </section>

        {/* COLUMN B: CENTRAL PANEL (cols: 8/12) */}
        <section className="col-span-12 lg:col-span-8 flex flex-col h-full overflow-hidden min-h-0">
          
          {/* Header Tab Selector for the Operations panel */}
          <div className="bg-slate-200 p-1.5 rounded-t-xl flex justify-between items-center flex-shrink-0 border-t border-l border-r border-slate-300">
            <div className="flex gap-1.5">
              <button
                onClick={() => setRightTab('editor')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  rightTab === 'editor'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Manejo de Alertas y Enlace Inteligente
              </button>
              <button
                onClick={() => {
                  setRightTab('history');
                  fetchData(); // Reload logs from server
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                  rightTab === 'history'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4 text-slate-500" />
                Historial de Despachos ({emailLogs.length})
              </button>
            </div>

            {activeDep && (
              <span className="text-[11px] font-medium bg-slate-50 px-2.5 py-1 rounded border border-slate-200/80 text-slate-700">
                Selección: <b>{activeDep.name}</b>
              </span>
            )}
          </div>

          {/* TAB 1: ACTIONS & EDITOR */}
          {rightTab === 'editor' ? (
            <div className="flex-1 bg-white border-l border-r border-b border-slate-200 rounded-b-xl flex flex-col overflow-hidden min-h-0">
              
              {/* If no dependency selected */}
              {!activeDep ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  <Building2 className="w-12 h-12 text-slate-205 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold">Seleccione una dependencia en la lista lateral para iniciar la gestación de alertas.</p>
                </div>
              ) : (
                <div className="flex-1 grid grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden min-h-0">
                  
                  {/* Left Half: Dependency Parameters and Observation Editor (6 cols) */}
                  <form onSubmit={handleSaveDependency} className="col-span-12 lg:col-span-5 p-4 overflow-y-auto space-y-4 max-h-full">
                    
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-1 text-slate-800">
                        <Database className="w-4 h-4 text-slate-500" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Parámetros de Alerta</h3>
                      </div>
                      <span className="text-[10px] text-slate-400">ID del Registro: #{activeDep.id}</span>
                    </div>

                    {/* Nombre Oficial de la Dependencia */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Nombre de la Dependencia / Enlace Gubernamental
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
                          placeholder="Secretaría o Instituto Estatal"
                        />
                      </div>
                    </div>

                    {/* Email de Contacto */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Correo Electrónico de Contacto (Oficial)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          className="w-full text-xs font-mono pl-8 pr-3 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
                          placeholder="enlace.solventacion@dependencia.gob.mx"
                        />
                      </div>
                    </div>

                    {/* Nombre del Titular / Encargado */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Nombre del Titular o Encargado Administrativo
                      </label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={formManager}
                          onChange={e => setFormManager(e.target.value)}
                          className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800"
                          placeholder="Nombre Completo con Grado Académico"
                        />
                      </div>
                    </div>

                    {/* Dates Configuration Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 block">
                          Fecha de Alerta (Modificable)
                        </label>
                        <input
                          type="date"
                          required
                          value={formAlert}
                          onChange={e => setFormAlert(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-600 block">
                          Plazo de Solventación Límite
                        </label>
                        <input
                          type="date"
                          required
                          value={formDeadline}
                          onChange={e => setFormDeadline(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    {/* Status Select Indicator */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        Estado Administrativo de Observación
                      </label>
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as Dependency['status'])}
                        className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-semibold"
                      >
                        <option value="al-corriente">✅ Al Corriente / En Trámite Normal</option>
                        <option value="alerta-activa">⚠️ Alerta Activa / Plazo Próximo</option>
                        <option value="vencido">🚨 Plazo Vencido / Omisión Administrativa</option>
                        <option value="solventado">⭐ Solventado / Turnado al Archivo</option>
                      </select>
                    </div>

                    {/* EDITABLE AUDIT OBSERVATIONS / FINDINGS */}
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> Pliegos Técnicos ({formObservations.length})
                        </label>
                      </div>

                      {/* Observations scrollable list in Editor */}
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {formObservations.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic py-2 text-center bg-slate-50/50 rounded border border-dashed">
                            No hay pliegos de observación reportados actualmente. Agrega una para redactar la alerta.
                          </p>
                        ) : (
                          formObservations.map((obs, idx) => (
                            <div key={idx} className="bg-slate-50 border rounded p-2 flex gap-1.5 text-[11px] hover:border-slate-300">
                              <span className="font-mono text-slate-400 font-bold">#{idx + 1}</span>
                              <p className="flex-1 text-slate-700 leading-snug">{obs}</p>
                              <button
                                type="button"
                                onClick={() => handleRemoveObservation(idx)}
                                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                                title="Borrar esta observación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Observation inputs */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Escribir nuevo pliego u observación..."
                          value={newObservation}
                          onChange={e => setNewObservation(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddObservation();
                            }
                          }}
                          className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 rounded placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={handleAddObservation}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-2.5 py-1 py-1.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-bold shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Agregar
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold tracking-tight text-xs py-2.5 rounded-lg transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 text-emerald-400" />
                        {isSaving ? 'Guardando Parámetros...' : 'Guardar y Sincronizar Registro'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDependency(activeDep.id)}
                        className="w-full bg-rose-50 hover:bg-rose-100 hover:text-rose-700 text-rose-600 border border-rose-200 text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Eliminar de forma permanente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Registro de Dependencia
                      </button>
                    </div>

                  </form>

                  {/* Right Half: AI Draft generator, live document envelope & Dispatch SMTP Terminal (7 cols) */}
                  <div className="col-span-12 lg:col-span-7 bg-slate-50/50 p-4 flex flex-col overflow-y-auto max-h-full space-y-4">
                    
                    <div className="border-b pb-2 flex justify-between items-center">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <Wand2 className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600">Redactor de Oficios con IA</h3>
                      </div>
                      <span className="text-[10px] text-slate-400">Soporte Gemini 3.5 Flash</span>
                    </div>

                    {/* Setup Tone & Parameters */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-3xs space-y-3">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                            Tono del Recordatorio
                          </label>
                          <select
                            value={aiTone}
                            onChange={e => setAiTone(e.target.value as any)}
                            className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded font-medium text-slate-700"
                          >
                            <option value="cordial">Cordial (Informativo / Colaborador)</option>
                            <option value="urgente">Urgente (Atención Prioritaria)</option>
                            <option value="formal-enérgico">Formal-Enérgico (Mención de Leyes)</option>
                            <option value="último-aviso">⚠️ Último Aviso (Apercibimiento Extremo)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                            Firma del Remitente Oficial
                          </label>
                          <input
                            type="text"
                            value={senderName}
                            onChange={e => setSenderName(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded text-slate-700 font-semibold"
                            placeholder="Nombre de Autoridad Auditoria"
                          />
                        </div>
                      </div>

                      {/* Observations Select list for AI to summarize */}
                      {formObservations.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                            Incluir observaciones seleccionadas en el correo:
                          </label>
                          <div className="bg-slate-50 max-h-24 overflow-y-auto p-1.5 rounded border border-slate-100 space-y-1">
                            {formObservations.map((obs, idx) => {
                              const isChecked = selectedObservations.includes(obs);
                              return (
                                <label key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-600 hover:text-slate-900 select-none cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedObservations(prev => prev.filter(o => o !== obs));
                                      } else {
                                        setSelectedObservations(prev => [...prev, obs]);
                                      }
                                    }}
                                    className="mt-0.5"
                                  />
                                  <span className="line-clamp-1">{obs}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Additional notes field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                          Instrucciones extras o prórrogas:
                        </label>
                        <input
                          type="text"
                          value={additionalNotes}
                          onChange={e => setAdditionalNotes(e.target.value)}
                          placeholder="Ej: Se otorga plazo extra por contingencia climática..."
                          className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded text-slate-700 placeholder-slate-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAIEmail}
                        disabled={isGenerating}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                      >
                        <Wand2 className="w-4 h-4 shrink-0" />
                        {isGenerating ? 'Generando Contenido Formal...' : 'Redactar Alerta Oficial con IA'}
                      </button>
                    </div>

                    {/* Borrador / Vista previa de la comunicación */}
                    {draftBody && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />
                            Vista Previa de Oficio Electrónico
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold uppercase">
                            Borrador Editable
                          </span>
                        </div>

                        {/* Envelope details */}
                        <div className="space-y-2 text-xs">
                          <div className="flex border-b pb-1">
                            <span className="w-16 font-bold text-slate-400 shrink-0">Para:</span>
                            <span className="text-slate-800 font-semibold">{formEmail || activeDep.email}</span>
                          </div>
                          
                          {/* Subject Input */}
                          <div className="flex items-center border-b pb-1">
                            <span className="w-16 font-bold text-slate-400 shrink-0">Asunto:</span>
                            <input
                              type="text"
                              value={draftSubject}
                              onChange={e => setDraftSubject(e.target.value)}
                              className="flex-1 bg-transparent border-none py-0 font-bold text-slate-800 focus:outline-hidden focus:ring-0 text-xs"
                            />
                          </div>

                          {/* Official Memo Paper Styling */}
                          <div className="pt-2">
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                              Cuerpo del Mensaje:
                            </label>
                            <textarea
                              rows={10}
                              value={draftBody}
                              onChange={e => setDraftBody(e.target.value)}
                              className="w-full text-xs p-3 bg-amber-50/20 border border-amber-100 rounded-lg text-slate-700 font-sans leading-relaxed focus:ring-1 focus:ring-indigo-500 focus:outline-hidden whitespace-pre-wrap select-text resize-none"
                            />
                            <p className="text-[9.5px] text-slate-400 mt-1 italic">
                              * Puede editar el correo directamente si desea agregar precisiones de último minuto.
                            </p>
                          </div>
                        </div>

                        {/* DESPACHO / SMTP SUBMISSION */}
                        <div className="pt-2 border-t space-y-3">
                          <button
                            type="button"
                            onClick={handleSendNotification}
                            disabled={isSending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5 text-emerald-200" />
                            {isSending ? 'Transmitiendo Alerta al Enlace...' : 'Emitir y Despachar Alerta Estatal'}
                          </button>

                          {/* RETRO LOGS CONSOLE */}
                          {consoleLogs.length > 0 && (
                            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[10.5px] text-slate-350 space-y-1 shadow-md">
                              <div className="flex items-center justify-between border-b border-slate-850 pb-1.5 mb-1.5 flex-shrink-0 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Terminal className="w-3 h-3 text-emerald-505" />
                                  Simulación SMTP Estatal Terminal Logs
                                </span>
                                <span className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.2 rounded text-emerald-400 font-bold inline-block animate-pulse">
                                  {isSending ? "REALIZANDO RELAY" : "CONEXIÓN CERRADA"}
                                </span>
                              </div>
                              
                              <div className="space-y-1 max-h-40 overflow-y-auto">
                                {consoleLogs.map((log, index) => (
                                  <div key={index} className="leading-snug">
                                    <span className="text-slate-500 select-none">auditor@system:~$ </span>
                                    <span className={index === consoleLogs.length - 1 && !isSending ? "text-emerald-400 font-semibold" : ""}>
                                      {log}
                                    </span>
                                  </div>
                                ))}
                                <div ref={consoleBottomRef} />
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* Explanation if draft not setup yet */}
                    {!draftBody && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-indigo-800 select-none">
                        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-indigo-900">¿Cómo redactar y enviar un aviso de solventación temporal?</p>
                          <ul className="list-disc pl-4 mt-1 space-y-1.5 text-indigo-800">
                            <li>Modifique la <b>Fecha de alerta</b> y salve los datos en el panel izquierdo si amerita.</li>
                            <li>Defina el <b>Tono de Auditoría</b> de la IA ( cordial, urgente o apercibimiento formal).</li>
                            <li>Haga clic en <b>"Redactar Alerta Oficial con IA"</b> para levantar la plantilla gubernamental.</li>
                            <li>Previsualice, edite a mano y presione <b>"Emitir y Despachar Alerta Estatal"</b> para simular la entrega SMTP con logs técnicos.</li>
                          </ul>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          ) : (
            
            /* TAB 2: HISTORY LOGS */
            <div className="flex-1 bg-white border-l border-r border-b border-slate-200 rounded-b-xl flex flex-col overflow-hidden min-h-0 p-4 space-y-4">
              
              <div className="flex flex-shrink-0 justify-between items-center border-b pb-2">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-500" />
                    Bitácora Histórica de Alertas Despachadas
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Registro auditable de correos electrónicos enviados a dependencias estatales durante el ejercicio fiscal 2026.
                  </p>
                </div>
                
                {emailLogs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="p-1 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-md cursor-pointer text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Vaciar Bitácora
                  </button>
                )}
              </div>

              {/* Grid or table representation of historical logs */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl max-h-[580px] min-h-0 bg-slate-50/30">
                {emailLogs.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Mail className="w-10 h-10 text-slate-201" />
                    <span className="font-semibold text-slate-500">Aún no se ha realizado ningún despacho de alertas</span>
                    <p className="text-[11.5px] text-slate-400 max-w-sm">No hay registros de correo disponibles. Complete los datos de un oficio en la pestaña anterior y envíela por el simulador de enrutamiento.</p>
                  </div>
                ) : (
                  emailLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-white hover:bg-slate-50 transition-colors flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-100 font-mono border text-slate-500 px-1.5 py-0.2 rounded">
                              ID: {log.id}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {log.dependencyName}
                            </span>
                          </div>
                          
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-405">
                            <span className="font-semibold flex items-center gap-1 text-slate-600">
                              <User className="w-3.5 h-3.5" /> {log.senderName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" /> &lt;{log.toEmail}&gt;
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="block text-[11px] text-slate-500 font-mono">
                            {new Date(log.sentAt).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-250 font-bold uppercase tracking-wider">
                            Entregado
                          </span>
                        </div>
                      </div>

                      {/* Subject and Body disclosure */}
                      <div className="p-2.5 bg-slate-50 rounded border text-[11.5px] text-slate-600 font-sans space-y-1 shadow-3xs hover:border-slate-350">
                        <div className="font-bold text-slate-800 pb-1 border-b">
                          Asunto: {log.subject}
                        </div>
                        <div className="whitespace-pre-wrap select-text max-h-32 overflow-y-auto leading-relaxed pt-1 select-text text-slate-600 font-mono text-[10px]">
                          {log.body}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </section>
      </main>

      {/* 4. REGISTER NEW DEPENDENCY MODAL OVERLAY */}
      {showRegisterForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">Registrar Nueva Dependencia</h3>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-indigo-300 mt-0.5">Ingreso Manual de Parámetros</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowRegisterForm(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer text-sm font-semibold select-none bg-slate-800 hover:bg-slate-700 h-6 w-6 rounded-full flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateDependency} className="p-5 space-y-4 text-left">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Nombre Oficial de la Dependencia <span className="text-indigo-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Ej. Secretaría de Finanzas y Planeación"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 placeholder-slate-400 font-semibold"
                  />
                </div>
              </div>

              {/* Enlace / Encargado Administrativo */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Encargado Administrativo / Titular <span className="text-indigo-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regManager}
                    onChange={e => setRegManager(e.target.value)}
                    placeholder="Ej. Dr. Andrés Manuel Ordóñez"
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Correo Institucional de Contacto <span className="text-indigo-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="enlace.solventacion@estado.gob.mx"
                    className="w-full text-xs font-mono pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    Fecha de Alerta
                  </label>
                  <input
                    type="date"
                    required
                    value={regAlert}
                    onChange={e => setRegAlert(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    required
                    value={regDeadline}
                    onChange={e => setRegDeadline(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Initial Status Selection */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Estado Administrativo Inicial
                </label>
                <select
                  value={regStatus}
                  onChange={e => setRegStatus(e.target.value as Dependency['status'])}
                  className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden text-slate-800 font-semibold"
                >
                  <option value="al-corriente">✅ Al Corriente / trámite ordinario</option>
                  <option value="alerta-activa">⚠️ Alerta Activa / plazos próximos</option>
                  <option value="vencido">🚨 Plazo Vencido / omisión</option>
                  <option value="solventado">⭐ Solventado / turnado al archivo</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-5 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 text-indigo-200" />
                  {isRegistering ? 'Procesando...' : 'Registrar y Guardar'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
