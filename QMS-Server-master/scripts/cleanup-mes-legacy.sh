#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ASVO-QMS: Удаление специфики дронов/Beryll из кодовой базы
# ═══════════════════════════════════════════════════════════════
#
# ВНИМАНИЕ: Перед запуском сделай коммит или создай ветку archive/kryptonit-mes!
#
# Использование:
#   chmod +x scripts/cleanup-mes-legacy.sh
#   git checkout -b archive/kryptonit-mes   # сохраняем оригинал
#   git checkout -b feature/qms-cleanup     # рабочая ветка
#   bash scripts/cleanup-mes-legacy.sh
#
# После запуска:
#   1. Обнови routes/index.js — убери require и router.use для удалённых роутеров
#   2. Обнови models/index.js — убери require и associations для удалённых моделей
#   3. Обнови index.js — убери require beryllExtendedRouter, initChecklistTemplates
#   4. Обнови App.tsx — убери импорты и роуты для удалённых страниц
#   5. Протестируй сборку: npm run build
# ═══════════════════════════════════════════════════════════════

set -e  # Остановка при ошибке

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  ASVO-QMS: Очистка от дрон/Beryll специфики              ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Проверяем что мы в корне проекта
if [ ! -d "QMS-Server-master" ] && [ ! -d "QMS-Client-main" ]; then
  echo -e "${RED}Ошибка: запускай из корня проекта (где лежат QMS-Server-master и QMS-Client-main)${NC}"
  exit 1
fi

DELETED=0

delete_if_exists() {
  if [ -e "$1" ]; then
    rm -rf "$1"
    echo -e "  ${RED}✕${NC} $1"
    ((DELETED++))
  fi
}

# ═══════════════════════════════════════════════════════════════
# 1. СЕРВЕРНАЯ ЧАСТЬ — Контроллеры
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[1/8] Серверные контроллеры...${NC}"

# Beryll (весь каталог — ~50 файлов)
delete_if_exists "QMS-Server-master/controllers/beryll"

# Дрон-контроллеры
delete_if_exists "QMS-Server-master/controllers/fcController.js"
delete_if_exists "QMS-Server-master/controllers/coralB_Controller.js"
delete_if_exists "QMS-Server-master/controllers/ELRS2_4_Controller.js"
delete_if_exists "QMS-Server-master/controllers/ELRS915_Controller.js"
delete_if_exists "QMS-Server-master/controllers/RankingsController.js"

# ═══════════════════════════════════════════════════════════════
# 2. СЕРВЕРНАЯ ЧАСТЬ — Роуты
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[2/8] Серверные роуты...${NC}"

delete_if_exists "QMS-Server-master/routes/beryllRouter.js"
delete_if_exists "QMS-Server-master/routes/beryllExtendedRouter.js"
delete_if_exists "QMS-Server-master/routes/beryll"
delete_if_exists "QMS-Server-master/routes/fcRouter.js"
delete_if_exists "QMS-Server-master/routes/CoralBRouter.js"
delete_if_exists "QMS-Server-master/routes/ELRS2_4_Router.js"
delete_if_exists "QMS-Server-master/routes/ELRS915_Router.js"
delete_if_exists "QMS-Server-master/routes/defectRouter915.js"
delete_if_exists "QMS-Server-master/routes/defectRouter2_4.js"
delete_if_exists "QMS-Server-master/routes/defectRouterCoralB.js"
delete_if_exists "QMS-Server-master/routes/passportsExportRoutes.js"

# ═══════════════════════════════════════════════════════════════
# 3. СЕРВЕРНАЯ ЧАСТЬ — Модели
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[3/8] Серверные модели...${NC}"

delete_if_exists "QMS-Server-master/models/BeryllExtended.js"
delete_if_exists "QMS-Server-master/models/definitions/Beryll.js"
delete_if_exists "QMS-Server-master/models/definitions/BeryllExtended.js"
delete_if_exists "QMS-Server-master/models/definitions/ComponentModels.js"
delete_if_exists "QMS-Server-master/models/definitions/YadroIntegration.js"

# ═══════════════════════════════════════════════════════════════
# 4. СЕРВЕРНАЯ ЧАСТЬ — Миграции (Beryll-специфика)
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[4/8] Beryll-миграции (перемещаем в архив)...${NC}"

mkdir -p "QMS-Server-master/migrations/_archive_beryll"
for f in QMS-Server-master/migrations/*beryll* QMS-Server-master/migrations/*Beryll* QMS-Server-master/migrations/*Yadro* QMS-Server-master/migrations/*yadro*; do
  if [ -e "$f" ]; then
    mv "$f" "QMS-Server-master/migrations/_archive_beryll/"
    echo -e "  ${YELLOW}→${NC} $f → _archive_beryll/"
    ((DELETED++))
  fi
done

# ═══════════════════════════════════════════════════════════════
# 5. КЛИЕНТ — API
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[5/8] Клиентские API...${NC}"

delete_if_exists "QMS-Client-main/src/api/beryll"
delete_if_exists "QMS-Client-main/src/api/beryllApi.ts"
delete_if_exists "QMS-Client-main/src/api/beryllExtendedApi.ts"
delete_if_exists "QMS-Client-main/src/api/coralBApi.ts"
delete_if_exists "QMS-Client-main/src/api/elrsApi.ts"
delete_if_exists "QMS-Client-main/src/api/fcApi.ts"
delete_if_exists "QMS-Client-main/src/api/firmwareApi.ts"
delete_if_exists "QMS-Client-main/src/api/firmwareControlApi.ts"
delete_if_exists "QMS-Client-main/src/api/mqttApi.ts"
delete_if_exists "QMS-Client-main/src/api/rankingsApi.ts"

# ═══════════════════════════════════════════════════════════════
# 6. КЛИЕНТ — Страницы
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[6/8] Клиентские страницы...${NC}"

# Beryll
delete_if_exists "QMS-Client-main/src/pages/Beryll"
delete_if_exists "QMS-Client-main/src/pages/beryll"

# Firmware / Прошивка
delete_if_exists "QMS-Client-main/src/pages/Firmware"
delete_if_exists "QMS-Client-main/src/pages/FirmwareOld"

# BetaFlight
delete_if_exists "QMS-Client-main/src/pages/BetaFlight"

# MQTT
delete_if_exists "QMS-Client-main/src/pages/MqttCheck"

# Rankings
delete_if_exists "QMS-Client-main/src/pages/Rankings"

# Таблицы плат
delete_if_exists "QMS-Client-main/src/pages/Tables/CoralBs"
delete_if_exists "QMS-Client-main/src/pages/Tables/ELRS24s"
delete_if_exists "QMS-Client-main/src/pages/Tables/ELRS915s"
delete_if_exists "QMS-Client-main/src/pages/Tables/FlightController"

# Модалки создания плат
delete_if_exists "QMS-Client-main/src/pages/Admin/CreateModals/CreateCoralB.tsx"
delete_if_exists "QMS-Client-main/src/pages/Admin/CreateModals/CreateELRS.tsx"
delete_if_exists "QMS-Client-main/src/pages/Admin/CreateModals/CreateFC.tsx"

# Admin дефекты плат
delete_if_exists "QMS-Client-main/src/pages/Admin/AdminDefectCategory/AdminDefect_Coral_B_categories.tsx"

# ═══════════════════════════════════════════════════════════════
# 7. КЛИЕНТ — Компоненты и сторы
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[7/8] Компоненты, сторы, типы...${NC}"

# Beryll компоненты
delete_if_exists "QMS-Client-main/src/components/beryll"

# Сторы плат
delete_if_exists "QMS-Client-main/src/store/Coral_B_store.ts"
delete_if_exists "QMS-Client-main/src/store/ELRS_915_and_2_4_store.ts"
delete_if_exists "QMS-Client-main/src/store/FC_store.ts"

# Типы
delete_if_exists "QMS-Client-main/src/types/BoardsForFlashModel.ts"
delete_if_exists "QMS-Client-main/src/types/beryll"

# ═══════════════════════════════════════════════════════════════
# 8. МОБИЛЬНОЕ PWA (если есть дрон-специфика)
# ═══════════════════════════════════════════════════════════════
echo -e "\n${GREEN}[8/8] Мобильное PWA — проверка...${NC}"

# PWA обычно чистый, но проверяем
if grep -rql "beryll\|firmware\|betaflight\|mqtt\|coral\|elrs" QMS-Mobile/mes-pwa/src/ 2>/dev/null; then
  echo -e "  ${YELLOW}⚠ В PWA найдены ссылки на удалённые модули — нужна ручная правка:${NC}"
  grep -rn "beryll\|firmware\|betaflight\|mqtt\|coral\|elrs" QMS-Mobile/mes-pwa/src/ 2>/dev/null || true
else
  echo -e "  ${GREEN}✓${NC} PWA чист — дрон-специфики нет"
fi

# ═══════════════════════════════════════════════════════════════
# ИТОГ
# ═══════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Удалено/перемещено: ${DELETED} файлов/каталогов${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

echo -e "\n${YELLOW}⚠ РУЧНАЯ ДОРАБОТКА (обязательно):${NC}"
echo ""
echo -e "  1. ${RED}QMS-Server-master/routes/index.js${NC}"
echo -e "     Удали строки с require и router.use для:"
echo -e "     fcRouter, CoralBRouter, ELRS915_Router, ELRS2_4_Router,"
echo -e "     defectRouter915, defectRouter2_4, defectRouterCoralB,"
echo -e "     beryllRouter, passportsExportRoutes"
echo ""
echo -e "  2. ${RED}QMS-Server-master/models/index.js${NC}"
echo -e "     Удали require для: Beryll, BeryllExtended, ComponentModels, YadroIntegration"
echo -e "     Удали все associations для Beryll* моделей"
echo ""
echo -e "  3. ${RED}QMS-Server-master/index.js${NC}"
echo -e "     Удали: require('./routes/beryllExtendedRouter')"
echo -e "     Удали: require('./controllers/beryll').initChecklistTemplates"
echo -e "     Удали: app.use('/api/beryll', beryllExtendedRouter)"
echo ""
echo -e "  4. ${RED}QMS-Client-main/src/App.tsx${NC}"
echo -e "     Удали импорты и <Route> для:"
echo -e "     Beryll*, Firmware*, BetaFlight, MqttCheck, Rankings,"
echo -e "     CoralBs, ELRS*, FlightController, CreateFC/ELRS/CoralB"
echo ""
echo -e "  5. ${RED}QMS-Client-main/src/utils/consts.ts${NC}"
echo -e "     Удали навигационные пункты для удалённых страниц"
echo ""
echo -e "  6. Проверь сборку:"
echo -e "     cd QMS-Server-master && npm start"
echo -e "     cd QMS-Client-main && npm run build"
echo ""
echo -e "${GREEN}Готово! Кодовая база очищена от дрон/Beryll специфики.${NC}"
