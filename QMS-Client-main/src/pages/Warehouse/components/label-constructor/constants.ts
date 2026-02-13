import {
  Wine,
  Umbrella,
  Flame,
  ArrowUp,
  Snowflake,
  AlertTriangle,
  Package,
} from "lucide-react";
import { IconLibraryItem } from "./types";

export const PX_PER_MM = 3.78;
export const SNAP_MM = 1.0;
export const MIN_MM = 2;


export const TEXT_VARIABLES = [
  { label: "Переменная...", value: "", description: "" },
  { label: "Код товара {{code}}", value: "{{code}}", description: "Уникальный код/артикул" },
  { label: "Название {{name}}", value: "{{name}}", description: "Наименование товара" },
  { label: "Серийный номер {{serial}}", value: "{{serial}}", description: "Серийный номер изделия" },
  { label: "Цена {{price}}", value: "{{price}}", description: "Стоимость" },
  { label: "Дата {{date}}", value: "{{date}}", description: "Текущая дата" },
  { label: "Контракт {{contract}}", value: "{{contract}}", description: "Номер контракта" },
  { label: "Партия {{batch}}", value: "{{batch}}", description: "Номер партии" },
  { label: "Количество {{qty}}", value: "{{qty}}", description: "Количество в упаковке" },
];


export const CUSTOM_FONTS_STORAGE_KEY = "mes_label_custom_fonts";


export const QR_SOURCES = [
  {
    value: "code",
    label: "Код товара",
    template: "{{code}}",
    description: "В QR будет закодирован уникальный код товара",
    example: "7342511000501"
  },
  {
    value: "serial",
    label: "Серийный номер",
    template: "{{serial}}",
    description: "В QR будет закодирован серийный номер изделия",
    example: "SN-2024-00813"
  },
  {
    value: "name",
    label: "Название товара",
    template: "{{name}}",
    description: "В QR будет закодировано наименование",
    example: "Видеопередатчик ВП-500"
  },
  {
    value: "contract",
    label: "№ Контракта",
    template: "{{contract}}",
    description: "В QR будет номер госконтракта",
    example: "187/249/9/П/25-63-ФЕ"
  },
  {
    value: "url",
    label: "Ссылка/URL",
    template: "{{url}}",
    description: "В QR будет ссылка для сканирования",
    example: "https://mes.local/item/813"
  },
  {
    value: "custom",
    label: "Свой текст",
    template: "",
    description: "Введите любой текст для кодирования",
    example: "Любой текст"
  },
];


export const COUNTER_FORMATS = [
  { label: "1 / 100", value: "{{current}} / {{total}}", description: "Текущий номер / Всего" },
  { label: "1 из 100", value: "{{current}} из {{total}}", description: "Текущий номер из Всего" },
  { label: "#1", value: "#{{current}}", description: "Только текущий номер" },
  { label: "№ 1 (100)", value: "№ {{current}} ({{total}})", description: "С символом номера" },
  { label: "Этикетка 1/100", value: "Этикетка {{current}}/{{total}}", description: "С подписью" },
];


export const DEFAULT_ICON_LIBRARY: IconLibraryItem[] = [
  {
    type: "fragile",
    label: "Хрупкое",
    icon: Wine,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6 L18 17 Q18 24 25 24 Q32 24 32 17 L32 6" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="24" x2="25" y2="38" stroke="#000" stroke-width="2"/>
      <line x1="18" y1="38" x2="32" y2="38" stroke="#000" stroke-width="2" stroke-linecap="round"/>
      <line x1="14" y1="44" x2="36" y2="44" stroke="#000" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  },
  {
    type: "keep_dry",
    label: "Влага",
    icon: Umbrella,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <line x1="25" y1="4" x2="25" y2="10" stroke="#000" stroke-width="2"/>
      <path d="M6 22 Q6 8 25 8 Q44 8 44 22 Z" fill="none" stroke="#000" stroke-width="2"/>
      <path d="M25 22 L25 38 Q25 42 21 42" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>
      <circle cx="11" cy="30" r="2" fill="#000"/>
      <circle cx="25" cy="34" r="2" fill="#000"/>
      <circle cx="39" cy="30" r="2" fill="#000"/>
      <circle cx="17" cy="40" r="2" fill="#000"/>
      <circle cx="33" cy="40" r="2" fill="#000"/>
    </svg>`
  },
  {
    type: "keep_away_heat",
    label: "Нагрев",
    icon: Flame,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="13" r="5" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="25" y1="3" x2="25" y2="6" stroke="#000" stroke-width="2"/>
      <line x1="25" y1="20" x2="25" y2="23" stroke="#000" stroke-width="2"/>
      <line x1="14" y1="13" x2="17" y2="13" stroke="#000" stroke-width="2"/>
      <line x1="33" y1="13" x2="36" y2="13" stroke="#000" stroke-width="2"/>
      <line x1="17" y1="5" x2="19" y2="8" stroke="#000" stroke-width="2"/>
      <line x1="33" y1="5" x2="31" y2="8" stroke="#000" stroke-width="2"/>
      <line x1="17" y1="21" x2="19" y2="18" stroke="#000" stroke-width="2"/>
      <line x1="33" y1="21" x2="31" y2="18" stroke="#000" stroke-width="2"/>
      <path d="M8 46 L8 34 L25 26 L42 34 L42 46" fill="none" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
    </svg>`
  },
  {
    type: "this_side_up",
    label: "Верх",
    icon: ArrowUp,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <polygon points="25,4 36,16 29,16 29,22 21,22 21,16 14,16" fill="none" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="25,26 36,38 29,38 29,44 21,44 21,38 14,38" fill="none" stroke="#000" stroke-width="2" stroke-linejoin="round"/>
    </svg>`
  },
  {
    type: "keep_frozen",
    label: "Заморозка",
    icon: Snowflake,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="12" width="10" height="24" rx="5" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="21" cy="32" r="5" fill="none" stroke="#000" stroke-width="2"/>
      <circle cx="21" cy="32" r="3" fill="#000"/>
      <line x1="21" y1="29" x2="21" y2="18" stroke="#000" stroke-width="2"/>
      <line x1="36" y1="12" x2="36" y2="28" stroke="#000" stroke-width="1.5"/>
      <line x1="28" y1="20" x2="44" y2="20" stroke="#000" stroke-width="1.5"/>
      <line x1="30" y1="14" x2="42" y2="26" stroke="#000" stroke-width="1.5"/>
      <line x1="42" y1="14" x2="30" y2="26" stroke="#000" stroke-width="1.5"/>
      <line x1="8" y1="44" x2="44" y2="44" stroke="#000" stroke-width="2"/>
      <text x="12" y="42" font-size="8" font-family="Arial, sans-serif" fill="#000">-18°C</text>
    </svg>`
  },
  {
    type: "warning",
    label: "Внимание",
    icon: AlertTriangle,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <polygon points="25,5 46,44 4,44" fill="none" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>
      <line x1="25" y1="17" x2="25" y2="30" stroke="#000" stroke-width="3" stroke-linecap="round"/>
      <circle cx="25" cy="37" r="2.5" fill="#000"/>
    </svg>`
  },
  {
    type: "do_not_stack",
    label: "Не штабелировать",
    icon: Package,
    svg: `<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="28" width="30" height="16" fill="none" stroke="#000" stroke-width="2"/>
      <rect x="14" y="14" width="22" height="12" fill="none" stroke="#000" stroke-width="2"/>
      <line x1="6" y1="6" x2="44" y2="44" stroke="#000" stroke-width="2.5"/>
    </svg>`
  },
];


export const CUSTOM_ICONS_STORAGE_KEY = "mes_label_custom_icons";

export const snap = (v: number) => Math.round(v / SNAP_MM) * SNAP_MM;
export const round2 = (v: number) => Math.round(v * 100) / 100;
