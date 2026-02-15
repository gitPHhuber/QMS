

export { API_BASE_URL, KEYCLOAK_CONFIG } from '../api/client'


export const config = {

  REQUEST_TIMEOUT: 15000,


  CACHE_TTL: 5 * 60 * 1000,


  DEBUG: import.meta.env.DEV,
}


export const PRODUCT_STATUS = {
  IN_PRODUCTION: 'IN_PRODUCTION',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  READY: 'READY',
  SHIPPED: 'SHIPPED',
  DEFECT: 'DEFECT',
  ARCHIVED: 'ARCHIVED',
} as const

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
} as const

export const BOX_STATUS = {
  ACTIVE: 'ACTIVE',
  RESERVED: 'RESERVED',
  EMPTY: 'EMPTY',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const

// ── DMS ──

export const DOCUMENT_STATUS = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  EFFECTIVE: 'EFFECTIVE',
  REVISION: 'REVISION',
  OBSOLETE: 'OBSOLETE',
  CANCELLED: 'CANCELLED',
} as const

export const DOCUMENT_TYPE = {
  POLICY: 'POLICY',
  MANUAL: 'MANUAL',
  PROCEDURE: 'PROCEDURE',
  WORK_INSTRUCTION: 'WORK_INSTRUCTION',
  FORM: 'FORM',
  RECORD: 'RECORD',
  SPECIFICATION: 'SPECIFICATION',
  PLAN: 'PLAN',
  EXTERNAL: 'EXTERNAL',
  OTHER: 'OTHER',
} as const

// ── NC / CAPA ──

export const NC_STATUS = {
  OPEN: 'OPEN',
  INVESTIGATING: 'INVESTIGATING',
  DISPOSITION: 'DISPOSITION',
  IMPLEMENTING: 'IMPLEMENTING',
  VERIFICATION: 'VERIFICATION',
  CLOSED: 'CLOSED',
  REOPENED: 'REOPENED',
} as const

export const NC_CLASSIFICATION = {
  CRITICAL: 'CRITICAL',
  MAJOR: 'MAJOR',
  MINOR: 'MINOR',
} as const

export const CAPA_STATUS = {
  INITIATED: 'INITIATED',
  INVESTIGATING: 'INVESTIGATING',
  PLANNING: 'PLANNING',
  PLAN_APPROVED: 'PLAN_APPROVED',
  IMPLEMENTING: 'IMPLEMENTING',
  VERIFYING: 'VERIFYING',
  EFFECTIVE: 'EFFECTIVE',
  INEFFECTIVE: 'INEFFECTIVE',
  CLOSED: 'CLOSED',
} as const

// ── Change Management ──

export const CHANGE_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  IMPACT_REVIEW: 'IMPACT_REVIEW',
  APPROVED: 'APPROVED',
  IN_PROGRESS: 'IN_PROGRESS',
  VERIFICATION: 'VERIFICATION',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const

// ── Complaints ──

export const COMPLAINT_STATUS = {
  RECEIVED: 'RECEIVED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  INVESTIGATING: 'INVESTIGATING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
} as const

export const COMPLAINT_SEVERITY = {
  CRITICAL: 'CRITICAL',
  MAJOR: 'MAJOR',
  MINOR: 'MINOR',
  INFORMATIONAL: 'INFORMATIONAL',
} as const

// ── Risk Management ──

export const RISK_STATUS = {
  IDENTIFIED: 'IDENTIFIED',
  ASSESSED: 'ASSESSED',
  MITIGATED: 'MITIGATED',
  ACCEPTED: 'ACCEPTED',
  CLOSED: 'CLOSED',
} as const

// ── Supplier Management ──

export const SUPPLIER_STATUS = {
  APPROVED: 'APPROVED',
  CONDITIONAL: 'CONDITIONAL',
  REJECTED: 'REJECTED',
  INACTIVE: 'INACTIVE',
} as const

// ── Equipment ──

export const EQUIPMENT_STATUS = {
  ACTIVE: 'ACTIVE',
  MAINTENANCE: 'MAINTENANCE',
  INACTIVE: 'INACTIVE',
} as const

export const CALIBRATION_STATUS = {
  IN_TOLERANCE: 'IN_TOLERANCE',
  OUT_OF_TOLERANCE: 'OUT_OF_TOLERANCE',
} as const

// ── Training ──

export const TRAINING_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const

// ── Audit ──

export const AUDIT_STATUS = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  EXECUTED: 'EXECUTED',
} as const

export const AUDIT_SCHEDULE_STATUS = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const

// ── Design ──

export const DESIGN_STATUS = {
  CONCEPT: 'CONCEPT',
  IN_DEVELOPMENT: 'IN_DEVELOPMENT',
  REVIEW: 'REVIEW',
  APPROVED: 'APPROVED',
  TRANSFERRED: 'TRANSFERRED',
  DISCONTINUED: 'DISCONTINUED',
} as const

// ── Validation ──

export const VALIDATION_STATUS = {
  PLANNING: 'PLANNING',
  EXECUTING: 'EXECUTING',
  ANALYSIS: 'ANALYSIS',
  APPROVED: 'APPROVED',
  ONGOING: 'ONGOING',
} as const

// ── E-Signature ──

export const ESIGN_STATUS = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
} as const


export const STATUS_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  // Production
  IN_PRODUCTION: 'warning',
  QUALITY_CONTROL: 'primary',
  READY: 'success',
  SHIPPED: 'primary',
  DEFECT: 'danger',
  ARCHIVED: 'neutral',
  // Tasks
  PENDING: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  ON_HOLD: 'neutral',
  // Warehouse
  ACTIVE: 'success',
  RESERVED: 'warning',
  EMPTY: 'neutral',
  WRITTEN_OFF: 'danger',
  // DMS
  DRAFT: 'neutral',
  REVIEW: 'warning',
  APPROVED: 'success',
  EFFECTIVE: 'success',
  REVISION: 'warning',
  OBSOLETE: 'neutral',
  // NC
  OPEN: 'danger',
  INVESTIGATING: 'warning',
  DISPOSITION: 'warning',
  IMPLEMENTING: 'primary',
  VERIFICATION: 'primary',
  CLOSED: 'neutral',
  REOPENED: 'danger',
  // CAPA
  INITIATED: 'warning',
  PLANNING: 'warning',
  PLAN_APPROVED: 'primary',
  VERIFYING: 'primary',
  INEFFECTIVE: 'danger',
  // NC Classification
  CRITICAL: 'danger',
  MAJOR: 'warning',
  MINOR: 'neutral',
  // Complaints
  RECEIVED: 'warning',
  UNDER_REVIEW: 'primary',
  RESOLVED: 'success',
  REJECTED: 'danger',
  INFORMATIONAL: 'neutral',
  // Risk
  IDENTIFIED: 'warning',
  ASSESSED: 'primary',
  MITIGATED: 'success',
  ACCEPTED: 'success',
  // Supplier
  CONDITIONAL: 'warning',
  INACTIVE: 'neutral',
  // Equipment
  MAINTENANCE: 'warning',
  IN_TOLERANCE: 'success',
  OUT_OF_TOLERANCE: 'danger',
  // Training
  SCHEDULED: 'warning',
  FAILED: 'danger',
  // Audit
  EXECUTED: 'success',
  PLANNED: 'warning',
  // Design
  CONCEPT: 'neutral',
  IN_DEVELOPMENT: 'primary',
  TRANSFERRED: 'success',
  DISCONTINUED: 'danger',
  // Validation
  EXECUTING: 'primary',
  ANALYSIS: 'warning',
  ONGOING: 'primary',
  // Change
  SUBMITTED: 'warning',
  IMPACT_REVIEW: 'warning',
  // E-Sign
  SIGNED: 'success',
  DECLINED: 'danger',
  EXPIRED: 'neutral',
}

export const STATUS_LABELS: Record<string, string> = {
  // Production
  IN_PRODUCTION: 'В производстве',
  QUALITY_CONTROL: 'Контроль качества',
  READY: 'Готов',
  SHIPPED: 'Отгружен',
  DEFECT: 'Брак',
  ARCHIVED: 'В архиве',
  // Tasks
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
  ON_HOLD: 'На паузе',
  // Warehouse
  ACTIVE: 'Активна',
  RESERVED: 'Резерв',
  EMPTY: 'Пусто',
  WRITTEN_OFF: 'Списана',
  // DMS
  DRAFT: 'Черновик',
  REVIEW: 'На рассмотрении',
  APPROVED: 'Утверждён',
  EFFECTIVE: 'Действует',
  REVISION: 'Ревизия',
  OBSOLETE: 'Устарел',
  // NC
  OPEN: 'Открыто',
  INVESTIGATING: 'Расследование',
  DISPOSITION: 'Решение',
  IMPLEMENTING: 'Внедрение',
  VERIFICATION: 'Верификация',
  CLOSED: 'Закрыто',
  REOPENED: 'Переоткрыто',
  // CAPA
  INITIATED: 'Инициировано',
  PLANNING: 'Планирование',
  PLAN_APPROVED: 'План утверждён',
  VERIFYING: 'Проверка',
  // EFFECTIVE already defined above (DMS)
  INEFFECTIVE: 'Неэффективно',
  // Classification
  CRITICAL: 'Критическое',
  MAJOR: 'Значительное',
  MINOR: 'Незначительное',
  // Complaints
  RECEIVED: 'Получена',
  UNDER_REVIEW: 'На рассмотрении',
  RESOLVED: 'Решена',
  REJECTED: 'Отклонена',
  INFORMATIONAL: 'Информационная',
  // Risk
  IDENTIFIED: 'Выявлен',
  ASSESSED: 'Оценён',
  MITIGATED: 'Снижен',
  ACCEPTED: 'Принят',
  // Supplier
  CONDITIONAL: 'Условно одобрен',
  INACTIVE: 'Неактивен',
  // Equipment
  MAINTENANCE: 'На обслуживании',
  IN_TOLERANCE: 'В допуске',
  OUT_OF_TOLERANCE: 'Вне допуска',
  // Training
  SCHEDULED: 'Запланировано',
  FAILED: 'Не сдано',
  // Audit
  EXECUTED: 'Проведён',
  PLANNED: 'Запланирован',
  // Design
  CONCEPT: 'Концепция',
  IN_DEVELOPMENT: 'Разработка',
  TRANSFERRED: 'Передан',
  DISCONTINUED: 'Прекращён',
  // Validation
  EXECUTING: 'Выполнение',
  ANALYSIS: 'Анализ',
  ONGOING: 'Текущий',
  // Change
  SUBMITTED: 'Подан',
  IMPACT_REVIEW: 'Оценка влияния',
  // E-Sign
  SIGNED: 'Подписано',
  DECLINED: 'Отклонено',
  EXPIRED: 'Истекло',
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  POLICY: 'Политика',
  MANUAL: 'Руководство',
  PROCEDURE: 'Процедура',
  WORK_INSTRUCTION: 'Рабочая инструкция',
  FORM: 'Форма',
  RECORD: 'Запись',
  SPECIFICATION: 'Спецификация',
  PLAN: 'План',
  EXTERNAL: 'Внешний документ',
  OTHER: 'Прочее',
}

export const NC_SOURCE_LABELS: Record<string, string> = {
  INCOMING_INSPECTION: 'Входной контроль',
  IN_PROCESS: 'В процессе',
  FINAL_INSPECTION: 'Финальный контроль',
  CUSTOMER_COMPLAINT: 'Рекламация',
  INTERNAL_AUDIT: 'Внутренний аудит',
  SUPPLIER: 'Поставщик',
  OTHER: 'Прочее',
}

export const CHANGE_TYPE_LABELS: Record<string, string> = {
  DESIGN: 'Конструкция',
  PROCESS: 'Процесс',
  DOCUMENT: 'Документ',
  SUPPLIER: 'Поставщик',
  SOFTWARE: 'ПО',
  MATERIAL: 'Материал',
  OTHER: 'Прочее',
}

export const SUPPLIER_TYPE_LABELS: Record<string, string> = {
  RAW_MATERIAL: 'Сырьё',
  COMPONENT: 'Комплектующие',
  SERVICE: 'Услуги',
  EQUIPMENT: 'Оборудование',
}

export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  PRODUCTION: 'Производственное',
  TEST: 'Испытательное',
  LAB: 'Лабораторное',
  STERILIZATION: 'Стерилизация',
}

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  INITIAL: 'Первичное',
  REFRESHER: 'Повторное',
  SPECIALIZED: 'Специальное',
}

export const AUDIT_TYPE_LABELS: Record<string, string> = {
  SYSTEM: 'Системный',
  PROCESS: 'Процессный',
  PRODUCT: 'Продуктовый',
}

export const VALIDATION_TYPE_LABELS: Record<string, string> = {
  IQ: 'IQ (квалификация монтажа)',
  OQ: 'OQ (операционная квалификация)',
  PQ: 'PQ (эксплуатационная квалификация)',
}

export const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
  LOW: 'Низкий',
  URGENT: 'Срочный',
}

export const USER_ROLES: Record<string, string> = {
  SUPER_ADMIN: 'Суперадмин',
  PRODUCTION_CHIEF: 'Начальник производства',
  WAREHOUSE_MASTER: 'Кладовщик',
  TECHNOLOGIST: 'Технолог',
  ASSEMBLER: 'Сборщик',
  QC_INSPECTOR: 'Контролёр ОТК',
  REPAIR_TECHNICIAN: 'Ремонтник',
  QMS_DIRECTOR: 'Директор по качеству',
  QMS_ENGINEER: 'Инженер по качеству',
  QMS_AUDITOR: 'Аудитор',
  DOC_CONTROLLER: 'Контролёр документов',
  QC_ENGINEER: 'Инженер ОТК',
  VIEWER: 'Наблюдатель',
}

export default config
