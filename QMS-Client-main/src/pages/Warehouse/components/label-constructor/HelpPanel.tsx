import React from "react";
import {
  X,
  QrCode,
  Database,
  Hash,
  Info,
  Umbrella,
  Wine,
  ArrowUp,
  Snowflake,
  Flame,
  AlertTriangle,
  Library,
  BookOpen,
} from "lucide-react";

interface HelpPanelProps {
  onClose: () => void;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
  return (
    <div className="w-80 bg-asvo-card border-l border-asvo-border overflow-y-auto shrink-0 shadow-lg">
      <div className="sticky top-0 bg-gradient-to-r from-asvo-amber-dim to-asvo-orange/10 border-b border-asvo-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-amber-600" />
          <span className="font-bold text-amber-900">Справка</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-asvo-amber-dim rounded text-amber-600"
          type="button"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-5 text-sm">

        <div>
          <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2 text-base">
            <Database size={18} className="text-indigo-500" />
            Переменные (подставятся автоматически)
          </h3>
          <div className="space-y-2">
            <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20">
              <code className="text-blue-700 font-bold text-sm">{"{{code}}"}</code>
              <p className="text-asvo-text-mid mt-1">Уникальный код товара</p>
              <p className="text-asvo-text-dim text-xs mt-1">Пример: 7342511000501</p>
            </div>
            <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20">
              <code className="text-blue-700 font-bold text-sm">{"{{name}}"}</code>
              <p className="text-asvo-text-mid mt-1">Наименование товара</p>
              <p className="text-asvo-text-dim text-xs mt-1">Пример: Приёмник 2xLR1121</p>
            </div>
            <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20">
              <code className="text-blue-700 font-bold text-sm">{"{{contract}}"}</code>
              <p className="text-asvo-text-mid mt-1">Номер госконтракта</p>
              <p className="text-asvo-text-dim text-xs mt-1">Пример: № 249/2/ОП/25/1/37</p>
            </div>
            <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20">
              <code className="text-blue-700 font-bold text-sm">{"{{date}}"}</code>
              <p className="text-asvo-text-mid mt-1">Текущая дата</p>
              <p className="text-asvo-text-dim text-xs mt-1">Пример: 20.01.2026, 15:30</p>
            </div>
            <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20">
              <code className="text-blue-700 font-bold text-sm">{"{{quantity}}"}</code>
              <p className="text-asvo-text-mid mt-1">Количество</p>
              <p className="text-asvo-text-dim text-xs mt-1">Пример: 500</p>
            </div>
            <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20">
              <code className="text-blue-700 font-bold text-sm">{"{{unit}}"}</code>
              <p className="text-asvo-text-mid mt-1">Единица измерения</p>
              <p className="text-asvo-text-dim text-xs mt-1">Пример: шт.</p>
            </div>
          </div>
        </div>


        <div>
          <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2 text-base">
            <Hash size={18} className="text-emerald-500" />
            Счётчик (нумерация этикеток)
          </h3>
          <div className="bg-asvo-green-dim p-3 rounded-lg border border-asvo-green/20 space-y-2">
            <p className="text-asvo-text-mid">При печати 100 этикеток:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-asvo-surface p-2 rounded border border-asvo-border">
                <span className="text-emerald-700 font-mono">1 / 100</span>
                <span className="text-asvo-text-dim ml-2">← первая</span>
              </div>
              <div className="bg-asvo-surface p-2 rounded border border-asvo-border">
                <span className="text-emerald-700 font-mono">2 / 100</span>
                <span className="text-asvo-text-dim ml-2">← вторая</span>
              </div>
              <div className="bg-asvo-surface p-2 rounded border border-asvo-border">
                <span className="text-emerald-700 font-mono">...</span>
              </div>
              <div className="bg-asvo-surface p-2 rounded border border-asvo-border">
                <span className="text-emerald-700 font-mono">100 / 100</span>
                <span className="text-asvo-text-dim ml-2">← последняя</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-asvo-text-mid">
              <code className="text-emerald-600">{"{{current}}"}</code> — номер текущей этикетки<br/>
              <code className="text-emerald-600">{"{{total}}"}</code> — всего этикеток в тираже
            </div>
          </div>
        </div>


        <div>
          <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2 text-base">
            <QrCode size={18} className="text-violet-500" />
            QR-код
          </h3>
          <div className="bg-asvo-purple-dim p-3 rounded-lg border border-asvo-purple/20">
            <p className="text-asvo-text-mid">При добавлении QR выберите, что в нём будет закодировано:</p>
            <ul className="mt-2 text-xs text-asvo-text-mid space-y-1">
              <li>• <strong>Код товара</strong> — уникальный идентификатор</li>
              <li>• <strong>Серийный номер</strong> — для отслеживания</li>
              <li>• <strong>Госконтракт</strong> — номер договора</li>
              <li>• <strong>Ссылка</strong> — URL для сканирования</li>
              <li>• <strong>Свой текст</strong> — любой текст</li>
            </ul>
          </div>
        </div>


        <div>
          <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2 text-base">
            <Library size={18} className="text-orange-500" />
            Иконки маркировки
          </h3>
          <div className="bg-asvo-amber-dim p-3 rounded-lg border border-asvo-orange/20">
            <p className="text-asvo-text-mid mb-2">Стандартные символы по ГОСТ:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 bg-asvo-surface p-2 rounded border border-asvo-border">
                <Wine size={16} className="text-asvo-text-mid" />
                <span>Хрупкое</span>
              </div>
              <div className="flex items-center gap-2 bg-asvo-surface p-2 rounded border border-asvo-border">
                <Umbrella size={16} className="text-asvo-text-mid" />
                <span>Влага</span>
              </div>
              <div className="flex items-center gap-2 bg-asvo-surface p-2 rounded border border-asvo-border">
                <Flame size={16} className="text-asvo-text-mid" />
                <span>Нагрев</span>
              </div>
              <div className="flex items-center gap-2 bg-asvo-surface p-2 rounded border border-asvo-border">
                <ArrowUp size={16} className="text-asvo-text-mid" />
                <span>Верх</span>
              </div>
              <div className="flex items-center gap-2 bg-asvo-surface p-2 rounded border border-asvo-border">
                <Snowflake size={16} className="text-asvo-text-mid" />
                <span>Заморозка</span>
              </div>
              <div className="flex items-center gap-2 bg-asvo-surface p-2 rounded border border-asvo-border">
                <AlertTriangle size={16} className="text-asvo-text-mid" />
                <span>Внимание</span>
              </div>
            </div>
            <p className="text-asvo-text-mid text-xs mt-2">+ можно загрузить свои иконки</p>
          </div>
        </div>


        <div>
          <h3 className="font-bold text-asvo-text mb-3 flex items-center gap-2 text-base">
            <Info size={18} className="text-cyan-500" />
            Советы
          </h3>
          <div className="bg-asvo-blue-dim p-3 rounded-lg border border-asvo-blue/20 text-xs text-asvo-text-mid space-y-2">
            <p>• <strong>Shift + тянуть</strong> — привязка к сетке 5мм</p>
            <p>• Выберите элемент, чтобы изменить его свойства</p>
            <p>• Переменные в двойных скобках <code className="text-cyan-700">{"{{}}"}</code> заменятся при печати</p>
            <p>• Сохраните шаблон, чтобы использовать повторно</p>
          </div>
        </div>
      </div>
    </div>
  );
};
