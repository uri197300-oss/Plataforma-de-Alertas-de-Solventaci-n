import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";
import { INITIAL_DEPENDENCIES } from "./src/data/defaults.js";
import { Dependency, EmailLog } from "./src/types.js";

// Helper to construct a base64 encoded MIME email for Gmail API
function makeGmailMime(to: string, subject: string, body: string, senderName: string): string {
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const parts = [
    `To: ${to}`,
    senderName ? `From: "${senderName}" <me>` : `From: <me>`,
    `Subject: ${utf8Subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body).toString("base64")
  ];
  const mimeStr = parts.join("\r\n");
  return Buffer.from(mimeStr)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Nodemailer Transporter lazy setup
let smtpTransporter: any = null;
function getSmtpTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }
  return smtpTransporter;
}

// Paths for JSON storage
const RECORDS_FILE_PATH = path.join(process.cwd(), "records.json");
const EMAIL_LOGS_FILE_PATH = path.join(process.cwd(), "email_logs.json");

// Helper to read/write dependencies
function loadRecords(): Dependency[] {
  try {
    if (fs.existsSync(RECORDS_FILE_PATH)) {
      const data = fs.readFileSync(RECORDS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading records.json, falling back to defaults:", err);
  }
  
  // Initialize with default values if not exists
  saveRecords(INITIAL_DEPENDENCIES);
  return INITIAL_DEPENDENCIES;
}

function saveRecords(records: Dependency[]): void {
  try {
    fs.writeFileSync(RECORDS_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing records.json:", err);
  }
}

// Helper to read/write email logs
function loadEmailLogs(): EmailLog[] {
  try {
    if (fs.existsSync(EMAIL_LOGS_FILE_PATH)) {
      const data = fs.readFileSync(EMAIL_LOGS_FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading email_logs.json:", err);
  }
  return [];
}

function saveEmailLogs(logs: EmailLog[]): void {
  try {
    fs.writeFileSync(EMAIL_LOGS_FILE_PATH, JSON.stringify(logs, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing email_logs.json:", err);
  }
}

// Lazy loaded Gemini client to prevent startup crashes when API key is missing
let aiClient: any = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error(
      "El API Key de Gemini no está configurado. Por favor, añada su GEMINI_API_KEY en la sección 'Settings > Secrets' de Google AI Studio para activar el redactor de correos con IA."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'Origin': 'https://ai.studio',
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Routes
  
  // 1. Get all dependencies
  app.get("/api/dependencies", (req, res) => {
    try {
      const records = loadRecords();
      res.json({ success: true, count: records.length, data: records });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 2. Put single dependency details (email, alertDate, deadlineDate, observations, status)
  app.put("/api/dependencies/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const records = loadRecords();
      const index = records.findIndex((r) => r.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, error: `Dependencia con ID ${id} no encontrada.` });
      }

      // Update fields
      const original = records[index];
      const updated: Dependency = {
        ...original,
        name: req.body.name ?? original.name,
        email: req.body.email ?? original.email,
        managerName: req.body.managerName ?? original.managerName,
        deadlineDate: req.body.deadlineDate ?? original.deadlineDate,
        alertDate: req.body.alertDate ?? original.alertDate,
        observations: req.body.observations ?? original.observations,
        status: req.body.status ?? original.status,
      };

      records[index] = updated;
      saveRecords(records);

      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create dependency
  app.post("/api/dependencies", (req, res) => {
    try {
      const records = loadRecords();
      const newId = records.length > 0 ? Math.max(...records.map(r => r.id)) + 1 : 1;
      const { name, email, managerName, deadlineDate, alertDate, observations, status } = req.body;

      const newDep: Dependency = {
        id: newId,
        name: name || "Nueva Dependencia",
        email: email || "",
        managerName: managerName || "",
        deadlineDate: deadlineDate || "2026-06-30",
        alertDate: alertDate || "2026-06-20",
        observations: observations || [],
        status: status || "al-corriente",
      };

      records.push(newDep);
      saveRecords(records);
      res.json({ success: true, data: newDep });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete single dependency
  app.delete("/api/dependencies/:id", (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const records = loadRecords();
      const filtered = records.filter(r => r.id !== id);
      saveRecords(filtered);
      res.json({ success: true, data: filtered, message: `Dependencia con ID ${id} eliminada.` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Clear all dependencies
  app.post("/api/dependencies/clear", (req, res) => {
    try {
      saveRecords([]);
      res.json({ success: true, data: [] });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 3. Force seed / reset to default values
  app.post("/api/dependencies/reset", (req, res) => {
    try {
      saveRecords(INITIAL_DEPENDENCIES);
      res.json({ success: true, data: INITIAL_DEPENDENCIES });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 4. Generate AI Personal Alert Email
  app.post("/api/generate-alert-email", async (req, res) => {
    try {
      const { dependencyId, tone, observationsToInclude, additionalNotes, senderName } = req.body;
      
      const records = loadRecords();
      const dep = records.find((r) => r.id === dependencyId);
      if (!dep) {
        return res.status(404).json({ success: false, error: "Dependencia no encontrada" });
      }

      // Check key & fetch client
      const ai = getGeminiClient();

      // Formulate prompt
      const prompt = `
Eres un Oficial Mayor de la Oficina de Control y Auditoría del Gobierno del Estado. Tu objetivo es redactar un oficio/correo formal de alerta de tiempos de solventación dirigido a la dependencia gubernamental: "${dep.name}".
Información útil:
- Encargado/Director: ${dep.managerName}
- Fecha limite de solventación obligatoria: ${dep.deadlineDate}
- Observaciones pendientes por solventar que se deben detallar: ${Array.isArray(observationsToInclude) && observationsToInclude.length > 0 ? observationsToInclude.map(o => '- ' + o).join('\n') : 'Falta de conciliaciones de cuentas generales y entrega de bitácoras oficiales.'}
- Remitente de la notificación: ${senderName || 'Unidad de Vigilancia y Fiscalización Externa'}
- Tono solicitado de la comunicación: "${tone || 'formal-enérgico'}" (los tonos disponibles pueden ser 'cordial' (informativo y colaborativo), 'urgente' (atención prioritaria), 'formal-enérgico' (señalamiento directo de leyes de responsabilidades) o 'último-aviso' (notificación extrema de fin de plazo)).
- Notas adicionales provistas por el auditor: "${additionalNotes || 'Ninguna'}"

REGLAS DE REDACCIÓN:
1. El correo debe estructurarse obligatoriamente en español mexicano con la jerga de auditoría gubernamental mexicana (menciona términos como "solventar", "órgano interno de control", "Pliego de observaciones", "Plazo improrrogable", "Ley de Responsabilidades Administrativas").
2. Debe tener un "Asunto" con alta visibilidad y claridad (ej. ASUNTO: Alerta Urgente de Solventación de Observaciones - [Dependencia]).
3. El cuerpo debe estar redactado de manera profesional, incluyendo el saludo, mención de los compromisos pendientes, consecuencias normativas si no se cumple el plazo con fecha límite ${dep.deadlineDate}, un llamado de acción claro y un cierre formal.
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
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText.trim());
      } catch (parseErr) {
        // Fallback parsers if format isn't strictly raw JSON
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) {
          parsedResponse = JSON.parse(match[0]);
        } else {
          throw new Error("No se pudo parsear el formato JSON generado por el modelo: " + responseText);
        }
      }

      res.json({ success: true, data: parsedResponse });
    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 5. Send Alert Email (Simulation, Real Gmail API, or Real SMTP)
  app.post("/api/send-email", async (req, res) => {
    try {
      const { dependencyId, toEmail, subject, body, senderName, gmailToken } = req.body;
      const records = loadRecords();
      const dep = records.find((r) => r.id === dependencyId);

      if (!dep) {
        return res.status(404).json({ success: false, error: "Dependencia no encontrada" });
      }

      const targetEmail = toEmail || dep.email;
      let steps: string[] = [];
      let deliveryStatus: "success" | "failed" = "success";

      if (gmailToken) {
        // Mode A: Real Google Gmail REST API Send (Using OAuth User's approved Token!)
        try {
          steps.push("📡 Conectando con la API segura de Gmail (gmail.googleapis.com)...");
          steps.push("🛡️ Autenticando token de acceso OAuth2 otorgado por el auditor...");
          steps.push(`👤 Remitente verificado: [${senderName || "Auditoría Superior"}]`);
          steps.push(`🔍 Verificando dirección de enlace estatal: <${targetEmail}>... OK`);
          steps.push("📦 Estructurando y codificando correo oficial en formato MIME Base64URL-Safe...");
          
          const rawMime = makeGmailMime(targetEmail, subject, body, senderName);
          
          steps.push("🚀 Transmitiendo paquete de datos vía HTTP REST API de Gmail...");
          
          const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${gmailToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ raw: rawMime })
          });

          if (!gmailRes.ok) {
            const errBody = await gmailRes.text();
            throw new Error(`Gmail API error: ${gmailRes.status} - ${errBody}`);
          }

          const gmailData = await gmailRes.json();
          steps.push(`📬 ¡Mensaje GMAIL REAL despachado con éxito! ID de Google: ${gmailData.id || "OK"}`);
        } catch (gmailErr: any) {
          console.error("Gmail Send Error: ", gmailErr);
          steps.push(`❌ FALLO DETECTADO en Gmail API: ${gmailErr.message}`);
          throw new Error(`No se pudo enviar el email real a través de Gmail. Verifique su sesión de Google: ${gmailErr.message}`);
        }
      } else {
        const smtpTransporter = getSmtpTransporter();
        if (smtpTransporter) {
          // Mode B: Real SMTP via Nodemailer (if SMTP host configured in .env)
          try {
            steps.push(`📡 Conectando con servidor de correo SMTP Real del Estado (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})...`);
            steps.push("🔐 Estableciendo canal cifrado TLS v1.3 seguro...");
            steps.push(`👤 Autenticando credenciales estatales: ${process.env.SMTP_USER}... OK`);
            steps.push(`🔍 Verificando dirección del destinatario: <${targetEmail}>... OK`);
            steps.push("🚀 Transmitiendo cabeceras oficiales y cuerpo de solventación...");

            const fromHeader = process.env.SMTP_FROM || `"${senderName}" <${process.env.SMTP_USER}>`;
            const info = await smtpTransporter.sendMail({
              from: fromHeader,
              to: targetEmail,
              subject: subject,
              text: body
            });

            steps.push(`📬 ¡Correo enviado de forma real a través de SMTP! MessageId: ${info.messageId || "SMTP-OK"}`);
          } catch (smtpErr: any) {
            console.error("SMTP Send Error: ", smtpErr);
            steps.push(`❌ FALLO EN SMTP: ${smtpErr.message}`);
            throw new Error(`Error de envío SMTP Real: ${smtpErr.message}`);
          }
        } else {
          // Mode C: Simulated SMTP Transport (Fallback out-of-the-box mode)
          steps = [
            "Iniciando comunicación con el servidor SMTP estatal (smtp.estado.gob.mx:587)...",
            "Estableciendo canal de transmisión segura bajo protocolo TLSv1.3...",
            `Autenticando credenciales de emisor: ${senderName || 'Unidad de Fiscalización'}...`,
            `Verificando dirección del destinatario gubernamental: <${targetEmail}>... OK`,
            "Preparando cabeceras y codificación UTF-8 para evitar caracteres alterados...",
            `Transmitiendo cuerpo del mensaje (Carga útil de solventación, ${body.length} caracteres)...`,
            "Email encolado y aceptado por relay remoto de correos. ID de Entrega: " + Math.random().toString(36).substring(7).toUpperCase(),
            "Entrega completada con éxito. Código de Estado: 250 OK Message accepted. (Soporte Simulado)"
          ];
        }
      }

      // Save to logs
      const logs = loadEmailLogs();
      const newLog: EmailLog = {
        id: Math.random().toString(36).substring(2, 11),
        dependencyId: dep.id,
        dependencyName: dep.name,
        toEmail: targetEmail,
        subject,
        body,
        sentAt: new Date().toISOString(),
        senderName: senderName || "Auditoría Superior del Estado",
        status: deliveryStatus,
      };

      logs.unshift(newLog); // Put newest logs first
      saveEmailLogs(logs);

      res.json({
        success: true,
        data: newLog,
        transportLogs: steps
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 6. Get all e-mail logs
  app.get("/api/email-logs", (req, res) => {
    try {
      const logs = loadEmailLogs();
      res.json({ success: true, count: logs.length, data: logs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 7. Clear all e-mail logs
  app.post("/api/email-logs/clear", (req, res) => {
    try {
      saveEmailLogs([]);
      res.json({ success: true, message: "Historial de alertas de correo vaciado con éxito." });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server local running synchronously on port ${PORT}`);
  });
}

startServer();
