import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { getConfig } from '../config';
import { logger } from './logger';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  const config = getConfig();
  if (!config.SMTP_HOST) {
    return null;
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return _transporter;
}

function loadTemplate(templateName: string, vars: Record<string, string>): string {
  const templatePath = path.join(__dirname, '..', '..', 'templates', `${templateName}.html`);
  try {
    let html = fs.readFileSync(templatePath, 'utf8');
    for (const [key, value] of Object.entries(vars)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return html;
  } catch {
    return `<p>${JSON.stringify(vars)}</p>`;
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  templateName: string,
  vars: Record<string, string>,
): Promise<void> {
  const config = getConfig();
  const html = loadTemplate(templateName, vars);
  const transporter = getTransporter();

  if (!transporter) {
    logger.info({ to, subject, templateName, vars }, 'EMAIL (dev mode, not sent)');
    return;
  }

  await transporter.sendMail({
    from: config.SMTP_FROM,
    to,
    subject,
    html,
  });
  logger.info({ to, subject }, 'Email sent');
}

export async function sendTelegramAlert(message: string): Promise<void> {
  const config = getConfig();
  if (!config.TELEGRAM_BOT_TOKEN || !config.TELEGRAM_ADMIN_CHAT_ID) {
    logger.info({ message }, 'TELEGRAM (dev mode, not sent)');
    return;
  }

  const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.TELEGRAM_ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    logger.info('Telegram alert sent');
  } catch (err) {
    logger.error({ err }, 'Failed to send Telegram alert');
  }
}
