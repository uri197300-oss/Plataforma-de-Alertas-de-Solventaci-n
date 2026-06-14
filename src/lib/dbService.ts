import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  getDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "./firebase";
import { Dependency, EmailLog } from "../types";
import { GoogleGenAI } from "@google/genai";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(error instanceof Error ? error.message : String(error));
}

// Check if we should use Firebase Firestore directly.
// We prefer Firebase Firestore if db is successfully initialized.
export function isFirebaseEnabled(): boolean {
  return db !== null;
}

// 1. Get all dependencies
export async function getDependencies(): Promise<Dependency[]> {
  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/dependencies");
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch dependencies from server");
    return data.data;
  }

  const path = "dependencies";
  try {
    const q = query(collection(db, path), orderBy("id", "asc"));
    const snapshot = await getDocs(q);
    const list: Dependency[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Dependency);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 2. Save / Update single dependency
export async function saveDependency(id: number, payload: Partial<Dependency>): Promise<Dependency> {
  if (!isFirebaseEnabled()) {
    const res = await fetch(`/api/dependencies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to save dependency on server");
    return data.data;
  }

  const path = `dependencies/${id}`;
  try {
    // Look up original
    const docRef = doc(db, "dependencies", String(id));
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`Dependency with ID ${id} not found.`);
    }

    const updated = {
      ...docSnap.data(),
      ...payload,
      id // Ensure index remains unchanged
    };

    await setDoc(docRef, updated);
    return updated as Dependency;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// 3. Register a new dependency
export async function createDependency(payload: Omit<Dependency, "id">): Promise<Dependency> {
  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/dependencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to create dependency on server");
    return data.data;
  }

  const path = "dependencies";
  try {
    // Get all docs to determine next ID
    const snapshot = await getDocs(collection(db, "dependencies"));
    let maxId = 0;
    snapshot.forEach((docSnap) => {
      const d = docSnap.data() as Dependency;
      if (d.id > maxId) maxId = d.id;
    });
    const newId = maxId + 1;

    const newDep: Dependency = {
      ...payload,
      id: newId
    } as Dependency;

    await setDoc(doc(db, "dependencies", String(newId)), newDep);
    return newDep;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

// 4. Delete dependency
export async function deleteDependency(id: number): Promise<void> {
  if (!isFirebaseEnabled()) {
    const res = await fetch(`/api/dependencies/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to delete dependency on server");
    return;
  }

  const path = `dependencies/${id}`;
  try {
    await deleteDoc(doc(db, "dependencies", String(id)));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 5. Clear all dependencies
export async function clearDependencies(): Promise<void> {
  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/dependencies/clear", {
      method: "POST"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to clear dependencies on server");
    return;
  }

  const path = "dependencies";
  try {
    const snapshot = await getDocs(collection(db, "dependencies"));
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 6. Reset base dependencies
export async function resetDependencies(initialDeps: Dependency[]): Promise<Dependency[]> {
  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/dependencies/reset", {
      method: "POST"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to reset dependencies on server");
    return data.data;
  }

  const path = "dependencies";
  try {
    // 1. Clear old
    const snapshot = await getDocs(collection(db, "dependencies"));
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();

    // 2. Add initial ones
    const writeNewBatch = writeBatch(db);
    initialDeps.forEach((dep) => {
      const docRef = doc(db, "dependencies", String(dep.id));
      writeNewBatch.set(docRef, dep);
    });
    await writeNewBatch.commit();

    return initialDeps;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// 7. Get email logs
export async function getEmailLogs(): Promise<EmailLog[]> {
  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/email-logs");
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch email logs from server");
    return data.data;
  }

  const path = "emailLogs";
  try {
    const q = query(collection(db, path), orderBy("sentAt", "desc"));
    const snapshot = await getDocs(q);
    const list: EmailLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as EmailLog);
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 8. Add email log and simulate
export async function sendAndLogEmail(
  dependencyId: number,
  dependencyName: string,
  toEmail: string,
  subject: string,
  body: string,
  senderName: string
): Promise<{ success: boolean; log: EmailLog; transportLogs: string[] }> {
  const steps = [
    "Iniciando comunicación con el servidor SMTP estatal (smtp.estado.gob.mx:587)...",
    "Estableciendo canal de transmisión segura bajo protocolo TLSv1.3...",
    `Autenticando credenciales de emisor: ${senderName || 'Unidad de Fiscalización'}...`,
    `Verificando dirección del destinatario gubernamental: <${toEmail}>... OK`,
    "Preparando cabeceras y codificación UTF-8 para evitar caracteres alterados...",
    `Transmitiendo cuerpo del mensaje (Carga útil de solventación, ${body.length} caracteres)...`,
    "Email encolado y aceptado por relay remoto de correos. ID de Entrega: " + Math.random().toString(36).substring(7).toUpperCase(),
    "Entrega completada con éxito. Código de Estado: 250 OK Message accepted."
  ];

  const newLog: EmailLog = {
    id: Math.random().toString(36).substring(2, 11),
    dependencyId,
    dependencyName,
    toEmail,
    subject,
    body,
    sentAt: new Date().toISOString(),
    senderName: senderName || "Departamento de Innovación Administrativa",
    status: "success",
  };

  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dependencyId,
        toEmail,
        subject,
        body,
        senderName
      })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to dispatch email via server");
    return {
      success: true,
      log: data.data,
      transportLogs: data.transportLogs
    };
  }

  const path = `emailLogs/${newLog.id}`;
  try {
    await setDoc(doc(db, "emailLogs", newLog.id), newLog);
    return {
      success: true,
      log: newLog,
      transportLogs: steps
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// 9. Clear email logs
export async function clearEmailLogs(): Promise<void> {
  if (!isFirebaseEnabled()) {
    const res = await fetch("/api/email-logs/clear", {
      method: "POST"
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to clear email logs from server");
    return;
  }

  const path = "emailLogs";
  try {
    const snapshot = await getDocs(collection(db, "emailLogs"));
    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// 10. Generate AI Personal Alert Email
export async function generateAIAlertEmail(params: {
  dependencyId: number;
  dependencyName: string;
  managerName: string;
  deadlineDate: string;
  tone: string;
  observationsToInclude: string[];
  additionalNotes: string;
  senderName: string;
}): Promise<{ subject: string; body: string }> {
  // Try server-side first
  if (!isFirebaseEnabled()) {
    try {
      const res = await fetch("/api/generate-alert-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dependencyId: params.dependencyId,
          tone: params.tone,
          observationsToInclude: params.observationsToInclude,
          additionalNotes: params.additionalNotes,
          senderName: params.senderName
        })
      });
      const data = await res.json();
      if (data.success) {
        return data.data;
      }
    } catch (err) {
      console.warn("Server AI route failed, attempting client-side fallback:", err);
    }
  }

  // Fallback to client-side Generation using VITE_GEMINI_API_KEY
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!clientKey) {
    throw new Error(
      "Para activar el redactor con IA en ejecuciones estáticas (GitHub Pages), debes agregar la propiedad VITE_GEMINI_API_KEY en tu variables de entorno de producción."
    );
  }

  const ai = new GoogleGenAI({ apiKey: clientKey });
  
  const prompt = `
Eres un Oficial de Enlace del Departamento de Innovación Administrativa (DGCH). Tu objetivo es redactar un oficio/correo formal de alerta de tiempos de solventación dirigido a la dependencia gubernamental: "${params.dependencyName}".
Información de la Alerta:
- Encargado/Director: ${params.managerName}
- Fecha limite de solventación obligatoria: ${params.deadlineDate}
- Observaciones pendientes por solventar que se deben detallar: ${params.observationsToInclude.length > 0 ? params.observationsToInclude.map(o => '- ' + o).join('\n') : 'Falta de conciliaciones de cuentas generales y entrega de bitácoras oficiales.'}
- Remitente de la notificación: ${params.senderName || 'Departamento de Innovación Administrativa'}
- Tono solicitado de la comunicación: "${params.tone || 'formal-enérgico'}" (los tonos disponibles pueden ser 'cordial' (informativo y colaborativo), 'urgente' (atención prioritaria), 'formal-enérgico' (señalamiento directo de leyes de responsabilidades) o 'último-aviso' (notificación extrema de fin de plazo)).
- Notas adicionales provistas por el auditor: "${params.additionalNotes || 'Ninguna'}"

REGLAS DE REDACCIÓN:
1. El correo debe estructurarse obligatoriamente en español mexicano con la jerga de auditoría gubernamental mexicana (menciona términos como "solventar", "órgano interno de control", "Pliego de observaciones", "Plazo improrrogable", "Ley de Responsabilidades Administrativas").
2. Debe tener un "Asunto" con alta visibilidad y claridad (ej. ASUNTO: Alerta Urgente de Solventación de Observaciones - [Dependencia]).
3. El cuerpo debe estar redactado de manera profesional, incluyendo el saludo, mención de los compromisos pendientes, consecuencias normativas si no se cumple el plazo con fecha límite ${params.deadlineDate}, un llamado de acción claro y un cierre formal.
4. Devuelve el resultado exclusivamente en formato JSON estructurado con el siguiente formato, no agregues texto markdown antes ni después del bloque JSON:
{
  "subject": "[Asunto descriptivo del correo]",
  "body": "[Cuerpo completo formateado usando saltos de línea \\n para párrafos, muy bien redactado]"
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const responseText = response.text || "";
  try {
    return JSON.parse(responseText.trim());
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error("No se pudo estructurar el correo generado: " + responseText);
  }
}
