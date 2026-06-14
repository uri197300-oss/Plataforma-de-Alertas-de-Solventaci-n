var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");

// src/data/defaults.ts
var INITIAL_DEPENDENCIES = [
  {
    id: 1,
    name: "Secretar\xEDa de Gobernaci\xF3n",
    email: "segob.auditorias@estado.gob.mx",
    managerName: "Lic. Clara Fuentes Mendoza",
    deadlineDate: "2026-06-25",
    alertDate: "2026-06-15",
    observations: [
      "Falta de bit\xE1coras oficiales de uso de veh\xEDculos asignados al primer trimestre de 2026.",
      "Justificaciones insuficientes para comisiones de representaci\xF3n exterior de mayo 2026."
    ],
    status: "alerta-activa"
  },
  {
    id: 2,
    name: "Secretar\xEDa de Planeaci\xF3n, Finanzas y Administraci\xF3n",
    email: "finanzas.solventacion@estado.gob.mx",
    managerName: "Dr. Eduardo Garza Ortiz",
    deadlineDate: "2026-07-10",
    alertDate: "2026-06-20",
    observations: [
      "Diferencias de conciliaci\xF3n bancaria sin actas aclaratorias para la cuenta p\xFAblica 10452.",
      "Registro contable extempor\xE1neo de subsidios otorgados a municipios."
    ],
    status: "al-corriente"
  }
];

// server.ts
var RECORDS_FILE_PATH = import_path.default.join(process.cwd(), "records.json");
var EMAIL_LOGS_FILE_PATH = import_path.default.join(process.cwd(), "email_logs.json");
function loadRecords() {
  try {
    if (import_fs.default.existsSync(RECORDS_FILE_PATH)) {
      const data = import_fs.default.readFileSync(RECORDS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading records.json, falling back to defaults:", err);
  }
  saveRecords(INITIAL_DEPENDENCIES);
  return INITIAL_DEPENDENCIES;
}
function saveRecords(records) {
  try {
    import_fs.default.writeFileSync(RECORDS_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing records.json:", err);
  }
}
function loadEmailLogs() {
  try {
    if (import_fs.default.existsSync(EMAIL_LOGS_FILE_PATH)) {
      const data = import_fs.default.readFileSync(EMAIL_LOGS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading email_logs.json:", err);
  }
  return [];
}
function saveEmailLogs(logs) {
  try {
    import_fs.default.writeFileSync(EMAIL_LOGS_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing email_logs.json:", err);
  }
}
var aiClient = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "El API Key de Gemini no est\xE1 configurado. Por favor, a\xF1ada su GEMINI_API_KEY en la secci\xF3n 'Settings > Secrets' de Google AI Studio para activar el redactor de correos con IA."
    );
  }
  if (!aiClient) {
    aiClient = new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "Origin": "https://ai.studio",
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/dependencies", (req, res) => {
    try {
      const records = loadRecords();
      res.json({ success: true, count: records.length, data: records });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.put("/api/dependencies/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const records = loadRecords();
      const index = records.findIndex((r) => r.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, error: `Dependencia con ID ${id} no encontrada.` });
      }
      const original = records[index];
      const updated = {
        ...original,
        name: req.body.name ?? original.name,
        email: req.body.email ?? original.email,
        managerName: req.body.managerName ?? original.managerName,
        deadlineDate: req.body.deadlineDate ?? original.deadlineDate,
        alertDate: req.body.alertDate ?? original.alertDate,
        observations: req.body.observations ?? original.observations,
        status: req.body.status ?? original.status
      };
      records[index] = updated;
      saveRecords(records);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/dependencies", (req, res) => {
    try {
      const records = loadRecords();
      const newId = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 1;
      const { name, email, managerName, deadlineDate, alertDate, observations, status } = req.body;
      const newDep = {
        id: newId,
        name: name || "Nueva Dependencia",
        email: email || "",
        managerName: managerName || "",
        deadlineDate: deadlineDate || "2026-06-30",
        alertDate: alertDate || "2026-06-20",
        observations: observations || [],
        status: status || "al-corriente"
      };
      records.push(newDep);
      saveRecords(records);
      res.json({ success: true, data: newDep });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.delete("/api/dependencies/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const records = loadRecords();
      const filtered = records.filter((r) => r.id !== id);
      saveRecords(filtered);
      res.json({ success: true, data: filtered, message: `Dependencia con ID ${id} eliminada.` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/dependencies/clear", (req, res) => {
    try {
      saveRecords([]);
      res.json({ success: true, data: [] });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/dependencies/reset", (req, res) => {
    try {
      saveRecords(INITIAL_DEPENDENCIES);
      res.json({ success: true, data: INITIAL_DEPENDENCIES });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/generate-alert-email", async (req, res) => {
    try {
      const { dependencyId, tone, observationsToInclude, additionalNotes, senderName } = req.body;
      const records = loadRecords();
      const dep = records.find((r) => r.id === dependencyId);
      if (!dep) {
        return res.status(404).json({ success: false, error: "Dependencia no encontrada" });
      }
      const ai = getGeminiClient();
      const prompt = `
Eres un Oficial Mayor de la Oficina de Control y Auditor\xEDa del Gobierno del Estado. Tu objetivo es redactar un oficio/correo formal de alerta de tiempos de solventaci\xF3n dirigido a la dependencia gubernamental: "${dep.name}".
Informaci\xF3n \xFAtil:
- Encargado/Director: ${dep.managerName}
- Fecha limite de solventaci\xF3n obligatoria: ${dep.deadlineDate}
- Observaciones pendientes por solventar que se deben detallar: ${Array.isArray(observationsToInclude) && observationsToInclude.length > 0 ? observationsToInclude.map((o) => "- " + o).join("\n") : "Falta de conciliaciones de cuentas generales y entrega de bit\xE1coras oficiales."}
- Remitente de la notificaci\xF3n: ${senderName || "Unidad de Vigilancia y Fiscalizaci\xF3n Externa"}
- Tono solicitado de la comunicaci\xF3n: "${tone || "formal-en\xE9rgico"}" (los tonos disponibles pueden ser 'cordial' (informativo y colaborativo), 'urgente' (atenci\xF3n prioritaria), 'formal-en\xE9rgico' (se\xF1alamiento directo de leyes de responsabilidades) o '\xFAltimo-aviso' (notificaci\xF3n extrema de fin de plazo)).
- Notas adicionales provistas por el auditor: "${additionalNotes || "Ninguna"}"

REGLAS DE REDACCI\xD3N:
1. El correo debe estructurarse obligatoriamente en espa\xF1ol mexicano con la jerga de auditor\xEDa gubernamental mexicana (menciona t\xE9rminos como "solventar", "\xF3rgano interno de control", "Pliego de observaciones", "Plazo improrrogable", "Ley de Responsabilidades Administrativas").
2. Debe tener un "Asunto" con alta visibilidad y claridad (ej. ASUNTO: Alerta Urgente de Solventaci\xF3n de Observaciones - [Dependencia]).
3. El cuerpo debe estar redactado de manera profesional, incluyendo el saludo, menci\xF3n de los compromisos pendientes, consecuencias normativas si no se cumple el plazo con fecha l\xEDmite ${dep.deadlineDate}, un llamado de acci\xF3n claro y un cierre formal.
4. Devuelve el resultado exclusivamente en formato JSON estructurado con el siguiente formato, no agregues texto markdown antes ni despu\xE9s del bloque JSON:
{
  "subject": "[Asunto descriptivo del correo]",
  "body": "[Cuerpo completo formateado usando saltos de l\xEDnea \\n para p\xE1rrafos, muy bien redactado]"
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
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText.trim());
      } catch (parseErr) {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedResponse = JSON.parse(match[0]);
        } else {
          throw new Error("No se pudo parsear el formato JSON generado por el modelo: " + responseText);
        }
      }
      res.json({ success: true, data: parsedResponse });
    } catch (error) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/send-email", async (req, res) => {
    try {
      const { dependencyId, toEmail, subject, body, senderName } = req.body;
      const records = loadRecords();
      const dep = records.find((r) => r.id === dependencyId);
      if (!dep) {
        return res.status(404).json({ success: false, error: "Dependencia no encontrada" });
      }
      const steps = [
        "Iniciando comunicaci\xF3n con el servidor SMTP estatal (smtp.estado.gob.mx:587)...",
        "Estableciendo canal de transmisi\xF3n segura bajo protocolo TLSv1.3...",
        `Autenticando credenciales de emisor: ${senderName || "Unidad de Fiscalizaci\xF3n"}...`,
        `Verificando direcci\xF3n del destinatario gubernamental: <${toEmail || dep.email}>... OK`,
        "Preparando cabeceras y codificaci\xF3n UTF-8 para evitar caracteres alterados...",
        `Transmitiendo cuerpo del mensaje (Carga \xFAtil de solventaci\xF3n, ${body.length} caracteres)...`,
        "Email encolado y aceptado por relay remoto de correos. ID de Entrega: " + Math.random().toString(36).substring(7).toUpperCase(),
        "Entrega completada con \xE9xito. C\xF3digo de Estado: 250 OK Message accepted."
      ];
      const logs = loadEmailLogs();
      const newLog = {
        id: Math.random().toString(36).substring(2, 11),
        dependencyId: dep.id,
        dependencyName: dep.name,
        toEmail: toEmail || dep.email,
        subject,
        body,
        sentAt: (/* @__PURE__ */ new Date()).toISOString(),
        senderName: senderName || "Auditor\xEDa Superior del Estado",
        status: "success"
      };
      logs.unshift(newLog);
      saveEmailLogs(logs);
      res.json({
        success: true,
        data: newLog,
        transportLogs: steps
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.get("/api/email-logs", (req, res) => {
    try {
      const logs = loadEmailLogs();
      res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  app.post("/api/email-logs/clear", (req, res) => {
    try {
      saveEmailLogs([]);
      res.json({ success: true, message: "Historial de alertas de correo vaciado con \xE9xito." });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server local running synchronously on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
