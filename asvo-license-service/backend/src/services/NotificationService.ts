import { sendEmail, sendTelegramAlert } from '../utils/email';

export class NotificationService {
  static async sendWelcome(email: string, orgName: string, apiKey: string) {
    await sendEmail(email, `Добро пожаловать в ASVO-QMS — ${orgName}`, 'welcome', {
      orgName,
      apiKey,
    });
  }

  static async sendSubscriptionCreated(email: string, orgName: string, tier: string, periodEnd: string) {
    await sendEmail(email, `Подписка создана — ${orgName}`, 'subscription-created', {
      orgName,
      tier,
      periodEnd,
    });
  }

  static async sendPaymentSuccess(email: string, orgName: string, amount: number, periodEnd: string) {
    await sendEmail(email, `Оплата получена — ${orgName}`, 'payment-success', {
      orgName,
      amount: String(amount),
      periodEnd,
    });
  }

  static async sendPaymentFailed(email: string, orgName: string, amount: number) {
    await sendEmail(email, `Ошибка оплаты — ${orgName}`, 'payment-failed', {
      orgName,
      amount: String(amount),
    });
  }

  static async sendLicenseExpiring(email: string, orgName: string, expiryDate: string, daysLeft: number) {
    await sendEmail(email, `Лицензия истекает через ${daysLeft} дн. — ${orgName}`, 'license-expiring', {
      orgName,
      expiryDate,
      daysLeft: String(daysLeft),
    });
  }

  static async sendSubscriptionSuspended(email: string, orgName: string) {
    await sendEmail(email, `Подписка приостановлена — ${orgName}`, 'subscription-suspended', {
      orgName,
    });
  }

  static async notifyAdminNewRegistration(orgName: string, email: string, tier: string) {
    await sendEmail('admin@asvo.tech', `Новая регистрация: ${orgName}`, 'new-registration-admin', {
      orgName,
      email,
      tier,
    });
    await sendTelegramAlert(`🆕 Новая регистрация: ${orgName} (${tier})\nEmail: ${email}`);
  }

  static async notifyAdminInstanceOffline(orgName: string, instanceName: string) {
    await sendEmail('admin@asvo.tech', `Инстанс offline: ${instanceName}`, 'instance-offline-admin', {
      orgName,
      instanceName,
    });
    await sendTelegramAlert(`⚠️ Инстанс offline > 24ч: ${instanceName} (${orgName})`);
  }
}
