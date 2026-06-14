export interface Dependency {
  id: number;
  name: string;
  email: string;
  managerName: string;
  deadlineDate: string; // YYYY-MM-DD
  alertDate: string;    // YYYY-MM-DD
  observations: string[];
  status: 'al-corriente' | 'alerta-activa' | 'vencido' | 'solventado';
}

export interface EmailLog {
  id: string;
  dependencyId: number;
  dependencyName: string;
  toEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  senderName: string;
  status: 'success' | 'failed';
}

export interface AlertTemplateConfig {
  dependencyId: number;
  tone: 'cordial' | 'urgente' | 'formal-enérgico' | 'último-aviso';
  observationsToInclude: string[];
  additionalNotes?: string;
  senderName: string;
}
