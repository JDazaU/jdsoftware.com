// Recibe el diagnóstico diligenciado y lo envía por correo desde su propia cuenta de Gmail.
// Variables de entorno en Vercel: GMAIL_USER, GMAIL_APP_PASSWORD y, opcional, DESTINO.
import nodemailer from "nodemailer";

const MAX_BYTES = 200000;
const json = (status, body) => Response.json(body, { status });
const clean = (v, n) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, n);

export function buildMail(data, env) {
  const r = data.respuestas && typeof data.respuestas === "object" ? data.respuestas : {};
  const empresa = clean(r.empresa, 120) || "empresa sin nombre";
  const mail = {
    from: `"Diagnóstico CRM" <${env.GMAIL_USER}>`,
    to: env.DESTINO || env.GMAIL_USER,
    subject: `Diagnóstico CRM: ${empresa}`,
    text: [String(data.solicitud || "").slice(0, 4000), "", "----------------------------------------", "", String(data.resumen).slice(0, 60000)].join("\n"),
    attachments: [{ filename: "respuestas.json", content: JSON.stringify(r, null, 2), contentType: "application/json" }],
  };
  // Si el cliente dejó un correo, "Responder" le escribe directamente a él
  const m = String(r.correo || "").match(/[^\s<>"',;]+@[^\s<>"',;]+\.[a-z]{2,}/i);
  if (m) mail.replyTo = m[0];
  return mail;
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return json(405, { error: "Método no permitido" });

    // Solo acepta envíos hechos desde el propio sitio
    const origin = request.headers.get("origin"), host = request.headers.get("host");
    if (origin && host) {
      let same = false;
      try { same = new URL(origin).host === host; } catch {}
      if (!same) return json(403, { error: "Origen no permitido" });
    }

    const raw = await request.text();
    if (raw.length > MAX_BYTES) return json(413, { error: "Contenido demasiado grande" });
    let data;
    try { data = JSON.parse(raw); } catch { return json(400, { error: "Formato no válido" }); }
    if (!data || typeof data.resumen !== "string" || !data.resumen.trim()) return json(400, { error: "Falta el resumen" });

    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.error("Faltan GMAIL_USER o GMAIL_APP_PASSWORD en las variables de entorno");
      return json(500, { error: "Servicio sin configurar" });
    }
    try {
      const transport = nodemailer.createTransport({ service: "gmail", auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD.replace(/\s/g, "") } });
      await transport.sendMail(buildMail(data, process.env));
      return json(200, { ok: true });
    } catch (e) {
      console.error("Error al enviar el correo:", e && e.message);
      return json(502, { error: "No fue posible enviar" });
    }
  },
};
