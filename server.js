import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DateTime } from "luxon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3000);
const availabilityPath = path.join(__dirname, "assets", "data", "availability.json");

app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get(["/", "/index.html"], (_request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.get("/consultation.html", (_request, response) => {
  response.sendFile(path.join(__dirname, "consultation.html"));
});

app.get("/consultation_site_beginner_html.html", (_request, response) => {
  response.sendFile(path.join(__dirname, "consultation_site_beginner_html.html"));
});

function isValidTimezone(timezone) {
  return Boolean(timezone) && DateTime.now().setZone(timezone).isValid;
}

async function readAvailability() {
  const content = await fs.readFile(availabilityPath, "utf8");
  const parsed = JSON.parse(content);

  return {
    sourceTimezone: parsed.sourceTimezone || "Europe/Rome",
    availableDates: Array.isArray(parsed.availableDates) ? parsed.availableDates : []
  };
}

function groupAvailabilityByTimezone({ availableDates, sourceTimezone, selectedTimezone }) {
  const grouped = new Map();

  availableDates.forEach((entry) => {
    const timeSlots = Array.isArray(entry.timeSlots) ? entry.timeSlots : [];

    timeSlots.forEach((time) => {
      const sourceDateTime = DateTime.fromISO(`${entry.date}T${time}`, { zone: sourceTimezone });

      if (!sourceDateTime.isValid) {
        return;
      }

      const clientDateTime = sourceDateTime.setZone(selectedTimezone);
      const dateKey = clientDateTime.toFormat("yyyy-MM-dd");

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          dateKey,
          label: clientDateTime.toFormat("cccc, LLL d"),
          timeSlots: []
        });
      }

      grouped.get(dateKey).timeSlots.push({
        startsAt: sourceDateTime.toUTC().toISO(),
        displayTime: clientDateTime.toFormat("HH:mm")
      });
    });
  });

  return Array.from(grouped.values())
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
    .map((group) => ({
      ...group,
      timeSlots: group.timeSlots.sort((left, right) => left.startsAt.localeCompare(right.startsAt))
    }));
}

function formatAppointment(dateTime, timezone) {
  return `${dateTime.toFormat("cccc, LLL d 'at' HH:mm")} (${timezone})`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP configuration is incomplete. Please fill in the .env file.");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

app.get("/api/availability", async (request, response) => {
  try {
    const { sourceTimezone, availableDates } = await readAvailability();
    const selectedTimezone = isValidTimezone(request.query.timezone)
      ? request.query.timezone
      : sourceTimezone;

    response.json({
      sourceTimezone,
      selectedTimezone,
      availableDates: groupAvailabilityByTimezone({
        availableDates,
        sourceTimezone,
        selectedTimezone
      })
    });
  } catch (error) {
    response.status(500).json({
      message: error.message || "Could not load availability."
    });
  }
});

app.post("/api/appointments", async (request, response) => {
  const {
    fullName,
    email,
    company,
    projectCore,
    projectType,
    communication,
    explanation,
    clientTimezone,
    appointmentStartsAt
  } = request.body || {};

  if (!fullName || !email || !projectCore || !projectType || !explanation || !appointmentStartsAt) {
    response.status(400).json({
      message: "Missing required fields for the appointment request."
    });
    return;
  }

  try {
    const { sourceTimezone } = await readAvailability();
    const selectedTimezone = isValidTimezone(clientTimezone) ? clientTimezone : sourceTimezone;
    const appointmentUtc = DateTime.fromISO(appointmentStartsAt, { zone: "utc" });

    if (!appointmentUtc.isValid) {
      response.status(400).json({
        message: "The selected appointment time is invalid."
      });
      return;
    }

    const clientAppointment = appointmentUtc.setZone(selectedTimezone);
    const consultantAppointment = appointmentUtc.setZone(sourceTimezone);
    const notificationEmail = process.env.APPOINTMENT_NOTIFICATION_EMAIL;
    const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;

    if (!notificationEmail) {
      throw new Error("APPOINTMENT_NOTIFICATION_EMAIL is missing in the .env file.");
    }

    const transporter = createTransporter();
    const subject = `New consultation request from ${fullName}`;
    const text = [
      "New consultation request",
      "",
      `Client: ${fullName}`,
      `Email: ${email}`,
      `Company/Project: ${company || "Not provided"}`,
      "",
      `Project core: ${projectCore}`,
      `Project topic: ${projectType}`,
      `Communication: ${communication || "Not provided"}`,
      "",
      "Explanation:",
      explanation,
      "",
      `Client appointment: ${formatAppointment(clientAppointment, selectedTimezone)}`,
      `Consultant appointment: ${formatAppointment(consultantAppointment, sourceTimezone)}`,
      `UTC start: ${appointmentUtc.toISO()}`
    ].join("\n");
    const html = `
      <h2>New consultation request</h2>
      <p><strong>Client:</strong> ${escapeHtml(fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Company/Project:</strong> ${escapeHtml(company || "Not provided")}</p>
      <p><strong>Project core:</strong> ${escapeHtml(projectCore)}</p>
      <p><strong>Project topic:</strong> ${escapeHtml(projectType)}</p>
      <p><strong>Communication:</strong> ${escapeHtml(communication || "Not provided")}</p>
      <p><strong>Explanation:</strong><br />${escapeHtml(explanation).replaceAll("\n", "<br />")}</p>
      <p><strong>Client appointment:</strong> ${escapeHtml(formatAppointment(clientAppointment, selectedTimezone))}</p>
      <p><strong>Consultant appointment:</strong> ${escapeHtml(formatAppointment(consultantAppointment, sourceTimezone))}</p>
      <p><strong>UTC start:</strong> ${escapeHtml(appointmentUtc.toISO())}</p>
    `;

    await transporter.sendMail({
      from: mailFrom,
      to: notificationEmail,
      replyTo: email,
      subject,
      text,
      html
    });

    response.json({
      message: "Appointment request sent successfully.",
      appointment: {
        clientDisplay: formatAppointment(clientAppointment, selectedTimezone),
        consultantDisplay: formatAppointment(consultantAppointment, sourceTimezone),
        selectedTimezone,
        sourceTimezone
      }
    });
  } catch (error) {
    response.status(500).json({
      message: error.message || "Could not send the appointment request email."
    });
  }
});

app.listen(port, () => {
  console.log(`Consultation site running at http://localhost:${port}`);
});
