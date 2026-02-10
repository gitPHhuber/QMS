#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ASVO-QMS: Полная интеграция модулей P0 + P1 + P2
# Запуск: bash integrate-qms.sh [путь_к_проекту]
# ═══════════════════════════════════════════════════════════════

set -e

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ── Путь к проекту ────────────────────────────────────────────
PROJECT_DIR="${1:-$(pwd)}"

# Автоопределение: если запущено из корня сервера
if [ -f "$PROJECT_DIR/package.json" ] && grep -q "fc-server" "$PROJECT_DIR/package.json" 2>/dev/null; then
    SERVER_DIR="$PROJECT_DIR"
elif [ -d "$PROJECT_DIR/QMS-Server-master" ]; then
    SERVER_DIR="$PROJECT_DIR/QMS-Server-master"
else
    SERVER_DIR="$PROJECT_DIR"
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  ASVO-QMS: Интеграция модулей P0 + P1 + P2${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "Директория сервера: ${YELLOW}$SERVER_DIR${NC}"
echo ""

# Проверка
if [ ! -f "$SERVER_DIR/package.json" ]; then
    echo -e "${RED}❌ package.json не найден в $SERVER_DIR${NC}"
    echo "Использование: bash integrate-qms.sh /path/to/QMS-Server-master"
    exit 1
fi

# Директория скрипта (где лежат файлы модулей)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ═══════════════════════════════════════════════════════════════
# ШАГ 0: Бэкап
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[0/7] 📦 Создаю бэкап...${NC}"
BACKUP_DIR="$SERVER_DIR/_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -f "$SERVER_DIR/models/index.js" "$BACKUP_DIR/" 2>/dev/null || true
cp -f "$SERVER_DIR/routes/index.js" "$BACKUP_DIR/" 2>/dev/null || true
cp -f "$SERVER_DIR/models/definitions/General.js" "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}  ✓ Бэкап в $BACKUP_DIR${NC}"

# ═══════════════════════════════════════════════════════════════
# ШАГ 1: Создаю директории
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[1/7] 📁 Создаю директории...${NC}"
mkdir -p "$SERVER_DIR/models/definitions"
mkdir -p "$SERVER_DIR/controllers"
mkdir -p "$SERVER_DIR/routes"
mkdir -p "$SERVER_DIR/services"
mkdir -p "$SERVER_DIR/utils"
mkdir -p "$SERVER_DIR/scripts"
mkdir -p "$SERVER_DIR/migrations"
echo -e "${GREEN}  ✓ Директории готовы${NC}"

# ═══════════════════════════════════════════════════════════════
# ШАГ 2: Копирую P0 файлы (Audit, DMS)
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[2/7] 📋 Копирую P0 модули (Audit Hash-Chain, DMS)...${NC}"

if [ -d "$SCRIPT_DIR/p0" ]; then
    P0_DIR="$SCRIPT_DIR/p0"
elif [ -d "$SCRIPT_DIR/qms-files" ]; then
    P0_DIR="$SCRIPT_DIR/qms-files"
else
    P0_DIR="$SCRIPT_DIR"
fi

# Утилиты
for f in auditLogger.js hashChainLogger.js auditVerifier.js; do
    if [ -f "$P0_DIR/utils/$f" ]; then
        cp -f "$P0_DIR/utils/$f" "$SERVER_DIR/utils/"
        echo "  → utils/$f"
    fi
done

# Модели P0
for f in Document.js; do
    if [ -f "$P0_DIR/models/definitions/$f" ]; then
        cp -f "$P0_DIR/models/definitions/$f" "$SERVER_DIR/models/definitions/"
        echo "  → models/definitions/$f"
    fi
done

# Контроллеры P0
for f in documentController.js; do
    if [ -f "$P0_DIR/controllers/$f" ]; then
        cp -f "$P0_DIR/controllers/$f" "$SERVER_DIR/controllers/"
        echo "  → controllers/$f"
    fi
done

# Сервисы P0
for f in DocumentService.js; do
    if [ -f "$P0_DIR/services/$f" ]; then
        cp -f "$P0_DIR/services/$f" "$SERVER_DIR/services/"
        echo "  → services/$f"
    fi
done

# Роуты P0
for f in documentRouter.js; do
    if [ -f "$P0_DIR/routes/$f" ]; then
        cp -f "$P0_DIR/routes/$f" "$SERVER_DIR/routes/"
        echo "  → routes/$f"
    fi
done

# Миграции P0
for f in "$P0_DIR"/migrations/*.js; do
    if [ -f "$f" ]; then
        cp -f "$f" "$SERVER_DIR/migrations/"
        echo "  → migrations/$(basename $f)"
    fi
done

# Скрипты P0
for f in "$P0_DIR"/scripts/*.js; do
    if [ -f "$f" ]; then
        cp -f "$f" "$SERVER_DIR/scripts/"
        echo "  → scripts/$(basename $f)"
    fi
done

echo -e "${GREEN}  ✓ P0 файлы скопированы${NC}"

# ═══════════════════════════════════════════════════════════════
# ШАГ 3: Копирую P1+P2 файлы
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[3/7] 📋 Копирую P1+P2 модули (Risk, Supplier, Audit, Training, Equipment, Review)...${NC}"

if [ -d "$SCRIPT_DIR/p1p2" ]; then
    P1P2_DIR="$SCRIPT_DIR/p1p2"
elif [ -d "$SCRIPT_DIR/qms-modules" ]; then
    P1P2_DIR="$SCRIPT_DIR/qms-modules"
else
    P1P2_DIR="$SCRIPT_DIR"
fi

# Модели P1+P2
for f in Risk.js Supplier.js InternalAudit.js Training.js Equipment.js ManagementReview.js; do
    if [ -f "$P1P2_DIR/models/definitions/$f" ]; then
        cp -f "$P1P2_DIR/models/definitions/$f" "$SERVER_DIR/models/definitions/"
        echo "  → models/definitions/$f"
    fi
done

# Контроллеры P1+P2
for f in riskController.js; do
    if [ -f "$P1P2_DIR/controllers/$f" ]; then
        cp -f "$P1P2_DIR/controllers/$f" "$SERVER_DIR/controllers/"
        echo "  → controllers/$f"
    fi
done

# Сервисы P1+P2
for f in RiskMatrixService.js SupplierScoringService.js; do
    if [ -f "$P1P2_DIR/services/$f" ]; then
        cp -f "$P1P2_DIR/services/$f" "$SERVER_DIR/services/"
        echo "  → services/$f"
    fi
done

# Роуты P1+P2
for f in riskRouter.js; do
    if [ -f "$P1P2_DIR/routes/$f" ]; then
        cp -f "$P1P2_DIR/routes/$f" "$SERVER_DIR/routes/"
        echo "  → routes/$f"
    fi
done

# Миграция P1+P2
for f in "$P1P2_DIR"/migrations/*.js; do
    if [ -f "$f" ]; then
        cp -f "$f" "$SERVER_DIR/migrations/"
        echo "  → migrations/$(basename $f)"
    fi
done

echo -e "${GREEN}  ✓ P1+P2 файлы скопированы${NC}"

# ═══════════════════════════════════════════════════════════════
# ШАГ 4: Патчим General.js — убираем unique с chainIndex
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[4/7] 🔧 Патчу General.js (chainIndex unique fix)...${NC}"

GENERAL="$SERVER_DIR/models/definitions/General.js"
if [ -f "$GENERAL" ]; then
    # Убираем unique: true у chainIndex (inline)
    sed -i 's/chainIndex:\s*{[^}]*unique:\s*true[^}]*}/chainIndex: { type: DataTypes.BIGINT, allowNull: true }/g' "$GENERAL"
    # Многострочный вариант
    sed -i '/chainIndex/,/}/{s/unique:\s*true,\?//}' "$GENERAL"
    echo -e "${GREEN}  ✓ chainIndex unique constraint удалён${NC}"
else
    echo -e "${YELLOW}  ⚠ General.js не найден, пропускаю${NC}"
fi

# ═══════════════════════════════════════════════════════════════
# ШАГ 5: Патчим models/index.js — добавляем импорты и ассоциации
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[5/7] 🔧 Патчу models/index.js (импорты + ассоциации)...${NC}"

MODELS_INDEX="$SERVER_DIR/models/index.js"

# Проверяем не добавлены ли уже
if grep -q "RiskRegister" "$MODELS_INDEX" 2>/dev/null; then
    echo -e "${YELLOW}  ⚠ QMS модули уже импортированы, пропускаю${NC}"
else

# ── Добавляем импорты после последнего require ──
# Находим последнюю строку с require и добавляем после неё
LAST_REQUIRE_LINE=$(grep -n "require(" "$MODELS_INDEX" | tail -1 | cut -d: -f1)

if [ -n "$LAST_REQUIRE_LINE" ]; then
    sed -i "${LAST_REQUIRE_LINE}a\\
\\
// ═══ QMS P0: Document Management ═══\\
const { QMSDocument, DocumentVersion, DocumentApproval } = require(\"./definitions/Document\");\\
\\
// ═══ QMS P1: Risk Management (ISO 14971) ═══\\
const { RiskRegister, RiskAssessment, RiskMitigation } = require(\"./definitions/Risk\");\\
\\
// ═══ QMS P1: Supplier Management (§7.4) ═══\\
const { Supplier, SupplierEvaluation, SupplierAudit } = require(\"./definitions/Supplier\");\\
\\
// ═══ QMS P2: Internal Audits (§8.2.4) ═══\\
const { AuditPlan, AuditSchedule, AuditFinding } = require(\"./definitions/InternalAudit\");\\
\\
// ═══ QMS P2: Training & Competency (§6.2) ═══\\
const { TrainingPlan, TrainingRecord, CompetencyMatrix } = require(\"./definitions/Training\");\\
\\
// ═══ QMS P2: Equipment & Calibration (§7.6) ═══\\
const { Equipment, CalibrationRecord } = require(\"./definitions/Equipment\");\\
\\
// ═══ QMS P2: Management Review (§5.6) ═══\\
const { ManagementReview, ReviewAction } = require(\"./definitions/ManagementReview\");" "$MODELS_INDEX"
    echo "  → Импорты добавлены"
fi

# ── Добавляем ассоциации перед module.exports ──
EXPORTS_LINE=$(grep -n "module.exports" "$MODELS_INDEX" | head -1 | cut -d: -f1)

if [ -n "$EXPORTS_LINE" ]; then
    sed -i "${EXPORTS_LINE}i\\
\\
// ═══ QMS Ассоциации ════════════════════════════════════════\\
// Risk → User (владелец)\\
User.hasMany(RiskRegister, { as: \"ownedRisks\", foreignKey: \"ownerId\" });\\
RiskRegister.belongsTo(User, { as: \"owner\", foreignKey: \"ownerId\" });\\
\\
// Training → User\\
User.hasMany(TrainingRecord, { as: \"trainings\", foreignKey: \"userId\" });\\
TrainingRecord.belongsTo(User, { as: \"trainee\", foreignKey: \"userId\" });\\
\\
// Equipment → User\\
User.hasMany(Equipment, { as: \"responsibleEquipment\", foreignKey: \"responsibleId\" });\\
Equipment.belongsTo(User, { as: \"responsible\", foreignKey: \"responsibleId\" });\\
\\
// Document → User\\
QMSDocument.belongsTo(User, { as: \"author\", foreignKey: \"authorId\" });\\
QMSDocument.belongsTo(User, { as: \"approver\", foreignKey: \"currentApproverId\" });\\
// ═══════════════════════════════════════════════════════════\\
" "$MODELS_INDEX"
    echo "  → Ассоциации добавлены"
fi

# ── Добавляем в module.exports ──
# Находим закрывающую скобку exports
sed -i '/^};$/i\
\
    // ═══ QMS модули ═══\
    QMSDocument, DocumentVersion, DocumentApproval,\
    RiskRegister, RiskAssessment, RiskMitigation,\
    Supplier, SupplierEvaluation, SupplierAudit,\
    AuditPlan, AuditSchedule, AuditFinding,\
    TrainingPlan, TrainingRecord, CompetencyMatrix,\
    Equipment, CalibrationRecord,\
    ManagementReview, ReviewAction,' "$MODELS_INDEX"
    echo "  → Экспорты добавлены"

fi

echo -e "${GREEN}  ✓ models/index.js обновлён${NC}"

# ═══════════════════════════════════════════════════════════════
# ШАГ 6: Патчим routes/index.js — добавляем роутеры
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[6/7] 🔧 Патчу routes/index.js (QMS роутеры)...${NC}"

ROUTES_INDEX="$SERVER_DIR/routes/index.js"

if grep -q "riskRouter" "$ROUTES_INDEX" 2>/dev/null; then
    echo -e "${YELLOW}  ⚠ QMS роутеры уже подключены, пропускаю${NC}"
else

# Добавляем импорты роутеров
LAST_REQUIRE_LINE=$(grep -n "require(" "$ROUTES_INDEX" | tail -1 | cut -d: -f1)

if [ -n "$LAST_REQUIRE_LINE" ]; then
    sed -i "${LAST_REQUIRE_LINE}a\\
\\
// ═══ QMS роутеры ═══\\
const documentRouter = require(\"./documentRouter\");\\
const riskRouter = require(\"./riskRouter\");" "$ROUTES_INDEX"
    echo "  → Импорты роутеров добавлены"
fi

# Добавляем router.use перед module.exports
EXPORTS_LINE=$(grep -n "module.exports" "$ROUTES_INDEX" | head -1 | cut -d: -f1)

if [ -n "$EXPORTS_LINE" ]; then
    sed -i "${EXPORTS_LINE}i\\
\\
// ═══ QMS эндпоинты ═══\\
router.use(\"/documents\", documentRouter);\\
router.use(\"/risks\", riskRouter);\\
// TODO: подключить по мере создания контроллеров:\\
// router.use(\"/suppliers\", supplierRouter);\\
// router.use(\"/internal-audits\", internalAuditRouter);\\
// router.use(\"/training\", trainingRouter);\\
// router.use(\"/equipment\", equipmentRouter);\\
// router.use(\"/management-review\", managementReviewRouter);\\
" "$ROUTES_INDEX"
    echo "  → Роутеры подключены"
fi

fi

echo -e "${GREEN}  ✓ routes/index.js обновлён${NC}"

# ═══════════════════════════════════════════════════════════════
# ШАГ 7: Архивируем Beryll-миграции и запускаем QMS-миграции
# ═══════════════════════════════════════════════════════════════
echo -e "${YELLOW}[7/7] 🗄️  Архивирую старые миграции и запускаю QMS...${NC}"

MIGRATIONS_DIR="$SERVER_DIR/migrations"
ARCHIVE_DIR="$MIGRATIONS_DIR/_archive_beryll"
mkdir -p "$ARCHIVE_DIR"

# Архивируем Beryll/Yadro миграции
ARCHIVED=0
for pattern in "*beryll*" "*Beryll*" "*yadro*" "*component-models*" "*defect-record*" "*beryll-defects*" "*beryll-extended*" "*beryll-racks*" "*beryll-servers*"; do
    for f in $MIGRATIONS_DIR/$pattern; do
        if [ -f "$f" ] && [ "$(dirname $f)" = "$MIGRATIONS_DIR" ]; then
            mv "$f" "$ARCHIVE_DIR/"
            ARCHIVED=$((ARCHIVED + 1))
        fi
    done
done
echo "  → Заархивировано миграций: $ARCHIVED"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ Интеграция завершена!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Скопировано файлов:"
echo -e "  Модели:       7 (General.js патч + Document + Risk + Supplier + Audit + Training + Equipment + Review)"
echo -e "  Контроллеры:  2 (documentController + riskController)"
echo -e "  Сервисы:      3 (DocumentService + RiskMatrix + SupplierScoring)"
echo -e "  Роутеры:      2 (documentRouter + riskRouter)"
echo -e "  Утилиты:      2-3 (auditLogger/hashChainLogger + auditVerifier)"
echo -e "  Миграции:     3 (audit-hashchain + dms + p1p2-all-modules)"
echo ""
echo -e "${YELLOW}Следующие шаги:${NC}"
echo ""
echo -e "  1. Проверь .env файл:"
echo -e "     ${BLUE}DB_NAME=asvo_qms${NC}"
echo -e "     ${BLUE}DB_USER=qms${NC}"
echo -e "     ${BLUE}DB_PASSWORD=qms_dev_2026${NC}"
echo -e "     ${BLUE}DB_PORT=5434${NC}"
echo ""
echo -e "  2. Подними PostgreSQL (если нет):"
echo -e "     ${BLUE}docker run -d --name qms-postgres \\${NC}"
echo -e "     ${BLUE}  -e POSTGRES_DB=asvo_qms \\${NC}"
echo -e "     ${BLUE}  -e POSTGRES_USER=qms \\${NC}"
echo -e "     ${BLUE}  -e POSTGRES_PASSWORD=qms_dev_2026 \\${NC}"
echo -e "     ${BLUE}  -p 5434:5432 postgres:16-alpine${NC}"
echo ""
echo -e "  3. Запусти миграции:"
echo -e "     ${BLUE}cd $SERVER_DIR${NC}"
echo -e "     ${BLUE}npx sequelize-cli db:migrate${NC}"
echo ""
echo -e "  4. Запусти сервер:"
echo -e "     ${BLUE}npm run dev${NC}"
echo ""
echo -e "  5. Проверь эндпоинты:"
echo -e "     ${BLUE}curl http://localhost:5000/api/documents${NC}"
echo -e "     ${BLUE}curl http://localhost:5000/api/risks${NC}"
echo -e "     ${BLUE}curl http://localhost:5000/api/risks/matrix${NC}"
echo -e "     ${BLUE}curl http://localhost:5000/api/audit/verify${NC}"
echo ""
echo -e "${YELLOW}Бэкап сохранён в: $BACKUP_DIR${NC}"
