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
  }
];
