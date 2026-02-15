export const roleTabs: { key: string; label: string }[] = [
  { key: "quality_manager", label: "Менеджер качества" },
  { key: "production_head", label: "Нач. производства" },
  { key: "director",        label: "Руководство" },
];

export const MONTH_NAMES: Record<string, string> = {
  "01": "Янв", "02": "Фев", "03": "Мар", "04": "Апр",
  "05": "Май", "06": "Июн", "07": "Июл", "08": "Авг",
  "09": "Сен", "10": "Окт", "11": "Ноя", "12": "Дек",
};

export const CATEGORY_DOT: Record<string, string> = {
  nc:        "bg-asvo-red",
  capa:      "bg-asvo-amber",
  doc:       "bg-asvo-blue",
  audit:     "bg-asvo-blue",
  risk:      "bg-asvo-purple",
  equipment: "bg-asvo-accent",
};

export const SUPPLIER_STATUS_LABELS: Record<string, { label: string; colorClass: string }> = {
  QUALIFIED:     { label: "Одобрен",       colorClass: "bg-asvo-accent" },
  CONDITIONAL:   { label: "Условный",      colorClass: "bg-asvo-amber" },
  PENDING:       { label: "На переоценке", colorClass: "bg-asvo-blue" },
  DISQUALIFIED:  { label: "Заблокирован",  colorClass: "bg-asvo-red" },
  SUSPENDED:     { label: "Приостановлен", colorClass: "bg-asvo-red" },
};
