import { Dependency } from '../types';

export const INITIAL_DEPENDENCIES: Dependency[] = [
  {
    id: 1,
    name: "Secretaría de Gobernación",
    email: "segob.auditorias@estado.gob.mx",
    managerName: "Lic. Clara Fuentes Mendoza",
    deadlineDate: "2026-06-25",
    alertDate: "2026-06-15",
    observations: [
      "Falta de bitácoras oficiales de uso de vehículos asignados al primer trimestre de 2026.",
      "Justificaciones insuficientes para comisiones de representación exterior de mayo 2026."
    ],
    status: "alerta-activa"
  },
  {
    id: 2,
    name: "Secretaría de Planeación, Finanzas y Administración",
    email: "finanzas.solventacion@estado.gob.mx",
    managerName: "Dr. Eduardo Garza Ortiz",
    deadlineDate: "2026-07-10",
    alertDate: "2026-06-20",
    observations: [
      "Diferencias de conciliación bancaria sin actas aclaratorias para la cuenta pública 10452.",
      "Registro contable extemporáneo de subsidios otorgados a municipios."
    ],
    status: "al-corriente"
  },
  {
    id: 3,
    name: "Secretaría Anticorrupción y Buen Gobierno",
    email: "anticorrupcion.control@estado.gob.mx",
    managerName: "Mtra. Silvia Jiménez Pérez",
    deadlineDate: "2026-06-30",
    alertDate: "2026-06-12",
    observations: [
      "Falta de expedientes de declaraciones patrimoniales de tres directores de área incorporados en marzo."
    ],
    status: "alerta-activa"
  },
  {
    id: 4,
    name: "Secretaría de Desarrollo Económico y Trabajo",
    email: "sdet.segui@estado.gob.mx",
    managerName: "Ing. Roberto Solís Ruiz",
    deadlineDate: "2026-06-08",
    alertDate: "2026-06-01",
    observations: [
      "No se acreditó la entrega física de apoyos productivos a cooperativas rurales en el periodo vacacional."
    ],
    status: "vencido"
  },
  {
    id: 5,
    name: "Secretaría de Arte y Cultura",
    email: "cultura.solv@estado.gob.mx",
    managerName: "Lic. Beatriz Ramos Vega",
    deadlineDate: "2026-07-20",
    alertDate: "2026-07-01",
    observations: [
      "Pendiente inventario físico de obras de arte registradas en el acervo del Palacio de Bellas Artes Estatal."
    ],
    status: "al-corriente"
  },
  {
    id: 6,
    name: "Secretaría de Turismo",
    email: "turismo.planeacion@estado.gob.mx",
    managerName: "Arq. Manuel Delgado Cruz",
    deadlineDate: "2026-06-28",
    alertDate: "2026-06-14",
    observations: [
      "Facturas de viáticos de ferias promocionales internacionales no coinciden con los montos autorizados.",
      "Falta contrato firmado con el proveedor externo de marketing digital de semana santa."
    ],
    status: "alerta-activa"
  },
  {
    id: 7,
    name: "Secretaría de Desarrollo Rural",
    email: "rural.solventa@estado.gob.mx",
    managerName: "Ing. Guadalupe Ortiz Sosa",
    deadlineDate: "2026-07-05",
    alertDate: "2026-06-25",
    observations: [
      "Falta de actas de asamblea aprobatorias para la distribución de fertilizantes agrícolas de la zona norte."
    ],
    status: "al-corriente"
  },
  {
    id: 8,
    name: "Secretaría de Infraestructura",
    email: "infraestructura.obras@estado.gob.mx",
    managerName: "Ing. Alejandro Nava Romero",
    deadlineDate: "2026-06-10",
    alertDate: "2026-06-02",
    observations: [
      "Retraso de reporte técnico justificativo por cambios en especificaciones del puente peatonal El Centenario.",
      "Faltan estimaciones de obra cargadas en la plataforma de transparencia para el proyecto vial Sur."
    ],
    status: "vencido"
  },
  {
    id: 9,
    name: "Secretaría de Movilidad y Transporte",
    email: "movilidad.control@estado.gob.mx",
    managerName: "Mtro. Javier Castillo Flores",
    deadlineDate: "2026-06-15",
    alertDate: "2026-06-05",
    observations: [
      "Licencias temporales expedidas sin el folio de pago correspondiente en archivo digital."
    ],
    status: "alerta-activa"
  },
  {
    id: 10,
    name: "Secretaría de Salud",
    email: "salud.administracion@estado.gob.mx",
    managerName: "Dra. Elvia Torres Palacios",
    deadlineDate: "2026-06-24",
    alertDate: "2026-06-10",
    observations: [
      "Medicamento oncológico caduco no reportado en tiempo para el canje correspondiente.",
      "Bitácoras de mantenimiento de equipos de resonancia magnética incompletas."
    ],
    status: "alerta-activa"
  },
  {
    id: 11,
    name: "Secretaría de Educación",
    email: "educacion.juridico@estado.gob.mx",
    managerName: "Mtro. Fernando Ayala Benítez",
    deadlineDate: "2026-07-15",
    alertDate: "2026-07-01",
    observations: [
      "Pendiente de comprobar el uso del subsidio para mantenimiento escolar de 12 primarias del sector Juárez."
    ],
    status: "al-corriente"
  },
  {
    id: 12,
    name: "Secretaría de Bienestar",
    email: "bienestar.programas@estado.gob.mx",
    managerName: "Lic. Valeria Rosas Luna",
    deadlineDate: "2026-05-30",
    alertDate: "2026-05-15",
    observations: [],
    status: "solventado"
  },
  {
    id: 13,
    name: "Secretaría de Seguridad Pública",
    email: "ssp.planeacion@estado.gob.mx",
    managerName: "Gral. Rodolfo Cantú Treviño",
    deadlineDate: "2026-06-20",
    alertDate: "2026-06-10",
    observations: [
      "Pendiente comprobación de cargamento para uniformes tácticos entregados al cuartel poniente."
    ],
    status: "alerta-activa"
  },
  {
    id: 14,
    name: "Secretaría de Medio Ambiente, Desarrollo Sustentable y Ordenamiento Territorial",
    email: "medioambiente.solv@estado.gob.mx",
    managerName: "Biól. Arturo Villa de la Rosa",
    deadlineDate: "2026-07-12",
    alertDate: "2026-06-28",
    observations: [
      "Faltas de firmas autógrafas en decretos de áreas naturales protegidas locales de carácter ejidal."
    ],
    status: "al-corriente"
  },
  {
    id: 15,
    name: "Secretaría de las Mujeres",
    email: "mujeres.admin@estado.gob.mx",
    managerName: "Dra. Regina Ocampo Silva",
    deadlineDate: "2026-06-18",
    alertDate: "2026-06-08",
    observations: [
      "Padres e hijos beneficiarios en refugios temporales no tienen acreditada la documentación oficial de ingreso."
    ],
    status: "alerta-activa"
  },
  {
    id: 16,
    name: "Secretaría de Ciencia, Humanidades, Tecnología e Innovación (SECIHTI)",
    email: "secihti.planeacion@estado.gob.mx",
    managerName: "Dr. Hugo Trejo Domínguez",
    deadlineDate: "2026-07-08",
    alertDate: "2026-06-25",
    observations: [
      "Reportes de avance de investigación de 4 becados de posgrado en el extranjero no están formalizados por el sínodo."
    ],
    status: "al-corriente"
  },
  {
    id: 17,
    name: "Secretaría de Deporte y Juventud",
    email: "deporte.control@estado.gob.mx",
    managerName: "Lic. Santiago Cordero Medina",
    deadlineDate: "2026-06-12",
    alertDate: "2026-06-02",
    observations: [
      "Mantenimiento correctivo de la alberca olímpica estatal pagado en exceso de un 15% respecto al presupuesto base."
    ],
    status: "vencido"
  },
  {
    id: 18,
    name: "Consejería Jurídica",
    email: "consejeria.juridica@estado.gob.mx",
    managerName: "Mtro. Octavio Paz Montes",
    deadlineDate: "2026-07-18",
    alertDate: "2026-07-01",
    observations: [
      "Falta archivo físico de amparos interpuestos contra el reglamento de vialidad de la zona de monumentos."
    ],
    status: "al-corriente"
  }
];
