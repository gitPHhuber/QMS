#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ASVO-QMS: Полная интеграция QMS модулей
# Запускать из ~/Documents/ASVO-QMS/
# ═══════════════════════════════════════════════════════════════

set -e
cd ~/Documents/ASVO-QMS

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  ASVO-QMS: Интеграция модулей (Audit, DMS, NC, CAPA)     ${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"

SERVER="QMS-Server-master"
CLIENT="QMS-Client-main"

# ═══ ШАГ 1: БЭКАПЫ ═══
echo -e "\n${GREEN}[1/5] Бэкапы...${NC}"
for f in models/index.js routes/index.js index.js; do
  if [ -f "$SERVER/$f" ] && [ ! -f "$SERVER/$f.pre-qms" ]; then
    cp "$SERVER/$f" "$SERVER/$f.pre-qms"
    echo -e "  ✓ $f → $f.pre-qms"
  fi
done

# ═══ ШАГ 2: models/index.js ═══
echo -e "\n${GREEN}[2/5] models/index.js...${NC}"
MODELS_FILE="$SERVER/models/index.js"

if ! grep -q "definitions/Document" "$MODELS_FILE"; then
  sed -i '/require("\.\/ProductionOutput")/a\
\
\
const {\
    Document,\
    DocumentVersion,\
    DocumentApproval,\
    DocumentDistribution,\
    setupDocumentAssociations,\
    DOCUMENT_TYPES,\
    DOCUMENT_STATUSES,\
    VERSION_STATUSES,\
    APPROVAL_ROLES,\
    APPROVAL_DECISIONS,\
} = require("./definitions/Document");\
\
\
const {\
    Nonconformity,\
    NcAttachment,\
    Capa,\
    CapaAction,\
    CapaVerification,\
    setupNcCapaAssociations,\
    NC_SOURCES,\
    NC_CLASSIFICATIONS,\
    NC_STATUSES,\
    NC_DISPOSITIONS,\
    CAPA_TYPES,\
    CAPA_STATUSES,\
    CAPA_PRIORITIES,\
    CAPA_ACTION_STATUSES,\
} = require("./definitions/NcCapa");' "$MODELS_FILE"
  echo -e "  ✓ Импорты Document + NcCapa"
fi

if ! grep -q "setupDocumentAssociations" "$MODELS_FILE"; then
  sed -i '/^module\.exports = {/i\
\
// QMS: Document Management System\
setupDocumentAssociations({ User });\
\
// QMS: NC + CAPA\
setupNcCapaAssociations({ User, Document });' "$MODELS_FILE"
  echo -e "  ✓ Associations"
fi

if ! grep -q "CAPA_ACTION_STATUSES" "$MODELS_FILE"; then
  sed -i '/^};$/i\
\
\
    // QMS: Document Management System\
    Document,\
    DocumentVersion,\
    DocumentApproval,\
    DocumentDistribution,\
    DOCUMENT_TYPES,\
    DOCUMENT_STATUSES,\
    VERSION_STATUSES,\
    APPROVAL_ROLES,\
    APPROVAL_DECISIONS,\
\
    // QMS: NC + CAPA\
    Nonconformity,\
    NcAttachment,\
    Capa,\
    CapaAction,\
    CapaVerification,\
    NC_SOURCES,\
    NC_CLASSIFICATIONS,\
    NC_STATUSES,\
    NC_DISPOSITIONS,\
    CAPA_TYPES,\
    CAPA_STATUSES,\
    CAPA_PRIORITIES,\
    CAPA_ACTION_STATUSES,' "$MODELS_FILE"
  echo -e "  ✓ Экспорты в module.exports"
fi

# ═══ ШАГ 3: routes/index.js ═══
echo -e "\n${GREEN}[3/5] routes/index.js...${NC}"
ROUTES_FILE="$SERVER/routes/index.js"

if ! grep -q "documentRouter" "$ROUTES_FILE"; then
  sed -i '/const productionOutputRouter/a\
\
// QMS модули\
const documentRouter = require("./documentRouter");\
const ncCapaRouter = require("./ncCapaRouter");' "$ROUTES_FILE"
  echo -e "  ✓ require documentRouter + ncCapaRouter"
fi

if ! grep -q '"/documents"' "$ROUTES_FILE"; then
  sed -i '/router\.use("\/production", productionOutputRouter);/a\
\
// QMS: Document Management System\
router.use("/documents", documentRouter);\
// QMS: Nonconformity + CAPA\
router.use("/nc", ncCapaRouter);' "$ROUTES_FILE"
  echo -e "  ✓ router.use /documents + /nc"
fi

# ═══ ШАГ 4: index.js — abilities ═══
echo -e "\n${GREEN}[4/5] Abilities в index.js...${NC}"
INDEX_FILE="$SERVER/index.js"

if ! grep -q "dms.view" "$INDEX_FILE"; then
  sed -i '/beryll\.manage/a\
\
      // QMS: DMS\
      { code: "dms.view", description: "Просмотр реестра документов" },\
      { code: "dms.create", description: "Создание документов" },\
      { code: "dms.approve", description: "Согласование документов" },\
      { code: "dms.manage", description: "Введение в действие, рассылка" },\
      // QMS: Audit\
      { code: "qms.audit.view", description: "Расширенный аудит-лог" },\
      { code: "qms.audit.verify", description: "Верификация hash-chain" },\
      { code: "qms.audit.report", description: "Отчёты для инспекции" },\
      // QMS: NC\
      { code: "nc.view", description: "Просмотр несоответствий" },\
      { code: "nc.create", description: "Регистрация NC" },\
      { code: "nc.manage", description: "Управление NC" },\
      // QMS: CAPA\
      { code: "capa.view", description: "Просмотр CAPA" },\
      { code: "capa.create", description: "Создание CAPA" },\
      { code: "capa.manage", description: "Управление CAPA" },\
      { code: "capa.verify", description: "Проверка эффективности CAPA" },' "$INDEX_FILE"
  echo -e "  ✓ 14 abilities добавлены"
fi

# ═══ ШАГ 5: hashChainLogger → auditLogger ═══
echo -e "\n${GREEN}[5/5] hashChainLogger → auditLogger...${NC}"
if [ -f "$SERVER/utils/hashChainLogger.js" ]; then
  [ -f "$SERVER/utils/auditLogger.js" ] && cp "$SERVER/utils/auditLogger.js" "$SERVER/utils/auditLogger.js.original"
  mv "$SERVER/utils/hashChainLogger.js" "$SERVER/utils/auditLogger.js"
  echo -e "  ✓ Переименован (все require совместимы)"
else
  echo -e "  → Уже готово"
fi

# ═══ ПРОВЕРКА ═══
echo -e "\n${YELLOW}═══ ПРОВЕРКА ═══${NC}"

check() { [ "$1" = "true" ] && echo -e "  ${GREEN}✓${NC} $2" || echo -e "  ${RED}✕${NC} $2"; }

check "$(grep -q 'setupDocumentAssociations' $MODELS_FILE && echo true)" "models: DMS associations"
check "$(grep -q 'setupNcCapaAssociations' $MODELS_FILE && echo true)" "models: NC/CAPA associations"
check "$(grep -q 'documentRouter' $ROUTES_FILE && echo true)" "routes: /documents"
check "$(grep -q 'ncCapaRouter' $ROUTES_FILE && echo true)" "routes: /nc"
check "$(grep -q 'dms.view' $INDEX_FILE && echo true)" "index: DMS abilities"
check "$(grep -q 'capa.verify' $INDEX_FILE && echo true)" "index: CAPA abilities"
check "$([ -f $SERVER/utils/auditVerifier.js ] && echo true)" "utils: auditVerifier.js"
check "$([ -f $SERVER/services/DocumentService.js ] && echo true)" "services: DocumentService.js"
check "$([ -f $SERVER/services/NcCapaService.js ] && echo true)" "services: NcCapaService.js"
check "$([ -f $CLIENT/src/api/qmsApi.ts ] && echo true)" "client: qmsApi.ts"
check "$([ -f $CLIENT/src/pages/QMS/QmsDashboardPage.tsx ] && echo true)" "client: QmsDashboardPage"

echo -e "\n${GREEN}✅ Готово!${NC} Дальше:
  cd $SERVER
  git diff --stat            # посмотри что изменилось
  npx sequelize-cli db:migrate   # миграции
  node scripts/backfill-audit-hashes.js   # hash-chain
  npm run dev                # запуск
"
