const { BeryllServer, BeryllServerChecklist, BeryllChecklistTemplate, BeryllBatch, BeryllServerComponent, User } = require("../../../models/index");
const { CHECKLIST_GROUPS } = require("../../../models/definitions/Beryll");
const ExcelJS = require("exceljs");


function formatBytes(bytes) {
  if (!bytes || bytes === 0) return null;

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}


function formatRamCapacity(capacity) {
  if (!capacity) return null;

  const numCapacity = parseInt(capacity);
  if (!numCapacity || isNaN(numCapacity)) return null;


  if (numCapacity < 1024) {
    return `${numCapacity} GB`;
  }


  return formatBytes(numCapacity);
}


function formatStorageCapacity(capacity) {
  if (!capacity) return null;

  const numCapacity = parseInt(capacity);
  if (!numCapacity || isNaN(numCapacity)) return null;


  if (numCapacity < 10000) {

    if (numCapacity >= 1000) {
      return `${(numCapacity / 1000).toFixed(2)} TB`;
    }
    return `${numCapacity} GB`;
  }


  return formatBytes(numCapacity);
}


function extractRamSpecsFromName(name, model) {
  const source = `${name || ''} ${model || ''}`.toUpperCase();
  const specs = {};


  const knownModels = {
    'M393A8G40AB2': { capacity: '64 GB', type: 'DDR4', speed: '3200 MT/s' },
    'M393A8G40BB4': { capacity: '64 GB', type: 'DDR4', speed: '2933 MT/s' },
    'M393A8G40MB2': { capacity: '64 GB', type: 'DDR4', speed: '2666 MT/s' },
    'M393A4K40CB2': { capacity: '32 GB', type: 'DDR4', speed: '2666 MT/s' },
    'M393A4K40DB2': { capacity: '32 GB', type: 'DDR4', speed: '2933 MT/s' },
    'M393A4K40DB3': { capacity: '32 GB', type: 'DDR4', speed: '3200 MT/s' },
    'M393A2K40CB2': { capacity: '16 GB', type: 'DDR4', speed: '2666 MT/s' },
    'M393A2K40DB2': { capacity: '16 GB', type: 'DDR4', speed: '2933 MT/s' },
    'M393A2K40DB3': { capacity: '16 GB', type: 'DDR4', speed: '3200 MT/s' },
    'M393A1K43DB2': { capacity: '8 GB', type: 'DDR4', speed: '2933 MT/s' },
    'M321R8GA0BB0': { capacity: '64 GB', type: 'DDR5', speed: '4800 MT/s' },
    'M321R4GA0BB0': { capacity: '32 GB', type: 'DDR5', speed: '4800 MT/s' },
  };


  for (const [modelPrefix, modelSpecs] of Object.entries(knownModels)) {
    if (source.includes(modelPrefix)) {
      return modelSpecs;
    }
  }


  const capacityMatch = source.match(/(\d+)\s*GB/i);
  if (capacityMatch) {
    specs.capacity = `${capacityMatch[1]} GB`;
  }


  if (source.includes('DDR5')) {
    specs.type = 'DDR5';
  } else if (source.includes('DDR4')) {
    specs.type = 'DDR4';
  } else if (source.includes('DDR3')) {
    specs.type = 'DDR3';
  }


  const speedMatch = source.match(/(\d{4})\s*(MT\/S|MHZ)?/i);
  if (speedMatch) {
    specs.speed = `${speedMatch[1]} MT/s`;
  }

  return Object.keys(specs).length > 0 ? specs : null;
}


function extractStorageSpecsFromName(name, model, componentType) {
  const source = `${name || ''} ${model || ''}`.toUpperCase();
  const specs = {};


  const knownHddModels = {
    'ST16000NM004J': { capacity: '16 TB', interface: 'SAS' },
    'ST18000NM000J': { capacity: '18 TB', interface: 'SAS' },
    'ST14000NM001G': { capacity: '14 TB', interface: 'SAS' },
    'ST12000NM001G': { capacity: '12 TB', interface: 'SAS' },
    'ST10000NM001G': { capacity: '10 TB', interface: 'SAS' },
    'ST8000NM000A': { capacity: '8 TB', interface: 'SAS' },
  };


  for (const [modelPrefix, modelSpecs] of Object.entries(knownHddModels)) {
    if (source.includes(modelPrefix)) {
      return modelSpecs;
    }
  }


  const tbMatch = source.match(/(\d+(?:\.\d+)?)\s*TB/i);
  if (tbMatch) {
    specs.capacity = `${tbMatch[1]} TB`;
  } else {
    const gbMatch = source.match(/(\d+)\s*GB/i);
    if (gbMatch) {
      specs.capacity = `${gbMatch[1]} GB`;
    }
  }


  if (source.includes('SAS')) {
    specs.interface = 'SAS';
  } else if (source.includes('NVME') || source.includes('NVM')) {
    specs.interface = 'NVMe';
  } else if (source.includes('SATA')) {
    specs.interface = 'SATA';
  } else if (componentType === 'HDD') {
    specs.interface = 'SAS';
  }

  return Object.keys(specs).length > 0 ? specs : null;
}

class PassportService {


  async generatePassport(id) {
    const server = await BeryllServer.findByPk(id, {
      include: [
        { model: User, as: "assignedTo", attributes: ["id", "login", "name", "surname"] },
        { model: BeryllBatch, as: "batch" },
        {
          model: BeryllServerChecklist,
          as: "checklists",
          include: [
            { model: BeryllChecklistTemplate, as: "template" },
            { model: User, as: "completedBy", attributes: ["name", "surname"] }
          ]
        }
      ]
    });

    if (!server) {
      throw new Error("Сервер не найден");
    }


    const components = await BeryllServerComponent.findAll({
      where: { serverId: id },
      order: [
        ["componentType", "ASC"],
        ["slot", "ASC"]
      ]
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Паспорт");


    sheet.columns = [
      { width: 8 },
      { width: 35 },
      { width: 50 },
      { width: 22 },
      { width: 22 },
      { width: 15 },
      { width: 18 }
    ];


    const headerFont = { bold: true, size: 14 };
    const titleFont = { bold: true, size: 11 };
    const normalFont = { size: 10 };
    const centerAlign = { horizontal: "center", vertical: "middle" };
    const leftAlign = { horizontal: "left", vertical: "middle" };

    const thinBorder = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    };


    sheet.mergeCells("A1:B1");
    sheet.getCell("A1").value = "АО «НПК Криптонит»";
    sheet.getCell("A1").font = titleFont;

    sheet.mergeCells("C1:G1");
    sheet.getCell("C1").value = "СОПРОВОДИТЕЛЬНЫЙ ПАСПОРТ ПРОИЗВОДСТВА";
    sheet.getCell("C1").font = headerFont;
    sheet.getCell("C1").alignment = centerAlign;

    sheet.mergeCells("A2:B2");
    sheet.getCell("A2").value = "АПК \"Берилл\"";
    sheet.getCell("A2").font = titleFont;

    sheet.mergeCells("C2:G2");
    sheet.getCell("C2").value = `МРТН.466514.002 - ${server.apkSerialNumber || "___"}`;
    sheet.getCell("C2").font = titleFont;
    sheet.getCell("C2").alignment = centerAlign;


    sheet.mergeCells("A3:B3");
    sheet.getCell("A3").value = "Серийный номер сервера, (АПК):";
    sheet.getCell("A3").font = normalFont;

    sheet.getCell("C3").value = server.serialNumber || "___";
    sheet.getCell("D3").value = server.apkSerialNumber || "___";


    let currentRow = 5;

    if (components.length > 0) {

      sheet.mergeCells(`A${currentRow}:G${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = "КОМПЛЕКТУЮЩИЕ СЕРВЕРА";
      sheet.getCell(`A${currentRow}`).font = headerFont;
      sheet.getCell(`A${currentRow}`).alignment = centerAlign;
      sheet.getCell(`A${currentRow}`).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9E1F2" }
      };
      currentRow++;


      sheet.getCell(`A${currentRow}`).value = "№";
      sheet.getCell(`B${currentRow}`).value = "Тип";
      sheet.getCell(`C${currentRow}`).value = "Наименование / Модель";
      sheet.getCell(`D${currentRow}`).value = "Серийный номер";
      sheet.getCell(`E${currentRow}`).value = "S/N Yadro";
      sheet.getCell(`F${currentRow}`).value = "Ревизия";
      sheet.getCell(`G${currentRow}`).value = "Характеристики";

      for (let col of ["A", "B", "C", "D", "E", "F", "G"]) {
        const cell = sheet.getCell(`${col}${currentRow}`);
        cell.font = titleFont;
        cell.alignment = centerAlign;
        cell.border = thinBorder;
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE0E0E0" }
        };
      }
      currentRow++;


      const grouped = {
        CPU: components.filter(c => c.componentType === "CPU"),
        RAM: components.filter(c => c.componentType === "RAM"),
        storage: components.filter(c => ["SSD", "HDD", "NVME"].includes(c.componentType)),
        NIC: components.filter(c => c.componentType === "NIC"),
        other: components.filter(c => ["MOTHERBOARD", "BMC", "PSU", "GPU", "RAID", "OTHER"].includes(c.componentType))
      };

      const typeLabels = {
        CPU: "Процессор",
        RAM: "Память",
        SSD: "SSD",
        HDD: "HDD",
        NVME: "NVMe",
        NIC: "Сетевой адаптер",
        MOTHERBOARD: "Мат. плата",
        BMC: "BMC",
        PSU: "БП",
        GPU: "Видеокарта",
        RAID: "RAID контроллер",
        OTHER: "Прочее"
      };

      let compNumber = 0;


      const allGrouped = [
        ...grouped.CPU,
        ...grouped.RAM,
        ...grouped.storage,
        ...grouped.NIC,
        ...grouped.other
      ];

      for (const comp of allGrouped) {
        compNumber++;


        sheet.getCell(`A${currentRow}`).value = compNumber;
        sheet.getCell(`A${currentRow}`).font = normalFont;
        sheet.getCell(`A${currentRow}`).alignment = centerAlign;


        sheet.getCell(`B${currentRow}`).value = typeLabels[comp.componentType] || comp.componentType;
        sheet.getCell(`B${currentRow}`).font = normalFont;
        sheet.getCell(`B${currentRow}`).alignment = leftAlign;


        const name = comp.name || comp.model || "—";
        sheet.getCell(`C${currentRow}`).value = name;
        sheet.getCell(`C${currentRow}`).font = normalFont;
        sheet.getCell(`C${currentRow}`).alignment = { ...leftAlign, wrapText: true };


        sheet.getCell(`D${currentRow}`).value = comp.serialNumber || "—";
        sheet.getCell(`D${currentRow}`).font = normalFont;
        sheet.getCell(`D${currentRow}`).alignment = centerAlign;


        sheet.getCell(`E${currentRow}`).value = comp.serialNumberYadro || "—";
        sheet.getCell(`E${currentRow}`).font = normalFont;
        sheet.getCell(`E${currentRow}`).alignment = centerAlign;


        const revision = comp.metadata?.revision || "";
        sheet.getCell(`F${currentRow}`).value = revision || "—";
        sheet.getCell(`F${currentRow}`).font = normalFont;
        sheet.getCell(`F${currentRow}`).alignment = centerAlign;


        let specs = this.formatComponentSpecs(comp);
        sheet.getCell(`G${currentRow}`).value = specs || "—";
        sheet.getCell(`G${currentRow}`).font = normalFont;
        sheet.getCell(`G${currentRow}`).alignment = centerAlign;


        for (let col of ["A", "B", "C", "D", "E", "F", "G"]) {
          sheet.getCell(`${col}${currentRow}`).border = thinBorder;
        }

        currentRow++;
      }


      sheet.mergeCells(`A${currentRow}:E${currentRow}`);
      sheet.getCell(`A${currentRow}`).value = "Итого комплектующих:";
      sheet.getCell(`A${currentRow}`).font = titleFont;
      sheet.getCell(`A${currentRow}`).alignment = { horizontal: "right", vertical: "middle" };
      sheet.getCell(`A${currentRow}`).border = thinBorder;


      const totalRAM = grouped.RAM.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);
      const totalStorage = grouped.storage.reduce((sum, s) => sum + (parseInt(s.capacity) || 0), 0);
      const totalCores = grouped.CPU.reduce((sum, c) => sum + (c.metadata?.cores || 0), 0);

      const ramFormatted = formatRamCapacity(totalRAM) || formatBytes(totalRAM) || "—";
      const storageFormatted = formatStorageCapacity(totalStorage) || formatBytes(totalStorage) || "—";

      sheet.mergeCells(`F${currentRow}:G${currentRow}`);
      sheet.getCell(`F${currentRow}`).value = `CPU: ${totalCores} ядер | RAM: ${ramFormatted} | Storage: ${storageFormatted}`;
      sheet.getCell(`F${currentRow}`).font = titleFont;
      sheet.getCell(`F${currentRow}`).alignment = centerAlign;
      sheet.getCell(`F${currentRow}`).border = thinBorder;

      currentRow += 2;
    }


    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
    sheet.getCell(`A${currentRow}`).value = "ОПЕРАЦИИ ПРОИЗВОДСТВА";
    sheet.getCell(`A${currentRow}`).font = headerFont;
    sheet.getCell(`A${currentRow}`).alignment = centerAlign;
    sheet.getCell(`A${currentRow}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD9E1F2" }
    };
    currentRow++;


    const headerRow = currentRow;
    sheet.getCell(`A${headerRow}`).value = "№\nп/п";
    sheet.getCell(`B${headerRow}`).value = "Операция";
    sheet.mergeCells(`C${headerRow}:E${headerRow}`);
    sheet.getCell(`C${headerRow}`).value = "Этап";
    sheet.getCell(`F${headerRow}`).value = "Подпись";
    sheet.getCell(`G${headerRow}`).value = "Дата";

    for (let col of ["A", "B", "C", "F", "G"]) {
      const cell = sheet.getCell(`${col}${headerRow}`);
      cell.font = titleFont;
      cell.alignment = centerAlign;
      cell.border = thinBorder;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" }
      };
    }

    sheet.getCell(`D${headerRow}`).border = thinBorder;
    sheet.getCell(`E${headerRow}`).border = thinBorder;
    sheet.getRow(headerRow).height = 30;
    currentRow++;


    const groupLabels = {
      [CHECKLIST_GROUPS.VISUAL]: "Визуальный осмотр",
      [CHECKLIST_GROUPS.TESTING]: "Проверка работоспособности",
      [CHECKLIST_GROUPS.QC_PRIMARY]: "Контрольная",
      [CHECKLIST_GROUPS.BURN_IN]: "Испытательная",
      [CHECKLIST_GROUPS.QC_FINAL]: "Контрольная"
    };


    const sortedChecklists = (server.checklists || []).sort(
      (a, b) => (a.template?.sortOrder || 0) - (b.template?.sortOrder || 0)
    );

    let currentGroup = null;
    let groupNumber = 0;

    for (const checklist of sortedChecklists) {
      const template = checklist.template;
      if (!template) continue;


      if (template.groupCode !== currentGroup) {
        currentGroup = template.groupCode;
        groupNumber++;

        sheet.getCell(`A${currentRow}`).value = groupNumber;
        sheet.getCell(`A${currentRow}`).font = titleFont;
        sheet.getCell(`A${currentRow}`).alignment = centerAlign;

        sheet.getCell(`B${currentRow}`).value = groupLabels[currentGroup] || template.groupCode;
        sheet.getCell(`B${currentRow}`).font = titleFont;
      }


      sheet.mergeCells(`C${currentRow}:E${currentRow}`);
      sheet.getCell(`C${currentRow}`).value = template.title;
      sheet.getCell(`C${currentRow}`).font = normalFont;
      sheet.getCell(`C${currentRow}`).alignment = { ...leftAlign, wrapText: true };


      if (checklist.completed && checklist.completedBy) {
        sheet.getCell(`F${currentRow}`).value =
          `${checklist.completedBy.surname} ${checklist.completedBy.name?.charAt(0) || ""}.`;
      }
      sheet.getCell(`F${currentRow}`).font = normalFont;
      sheet.getCell(`F${currentRow}`).alignment = centerAlign;


      if (checklist.completedAt) {
        const date = new Date(checklist.completedAt);
        sheet.getCell(`G${currentRow}`).value = date.toLocaleDateString("ru-RU");
      }
      sheet.getCell(`G${currentRow}`).font = normalFont;
      sheet.getCell(`G${currentRow}`).alignment = centerAlign;


      for (let col of ["A", "B", "C", "D", "E", "F", "G"]) {
        sheet.getCell(`${col}${currentRow}`).border = thinBorder;
      }

      currentRow++;
    }


    if (server.burnInStartAt) {
      currentRow++;
      sheet.getCell(`B${currentRow}`).value = "Дата и время установки на технологический прогон:";
      sheet.getCell(`B${currentRow}`).font = normalFont;
      sheet.mergeCells(`C${currentRow}:E${currentRow}`);
      sheet.getCell(`C${currentRow}`).value = new Date(server.burnInStartAt).toLocaleString("ru-RU");
      sheet.getCell(`C${currentRow}`).font = normalFont;
    }

    if (server.burnInEndAt) {
      currentRow++;
      sheet.getCell(`B${currentRow}`).value = "Дата и время завершения технологического прогона:";
      sheet.getCell(`B${currentRow}`).font = normalFont;
      sheet.mergeCells(`C${currentRow}:E${currentRow}`);
      sheet.getCell(`C${currentRow}`).value = new Date(server.burnInEndAt).toLocaleString("ru-RU");
      sheet.getCell(`C${currentRow}`).font = normalFont;
    }


    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `Паспорт_${server.apkSerialNumber || server.id}.xlsx`;

    return {
      buffer,
      fileName
    };
  }


  formatComponentSpecs(comp) {
    if (comp.componentType === "CPU") {
      const parts = [];
      const cores = comp.metadata?.cores;
      const threads = comp.metadata?.threads;
      const speed = comp.speed;

      if (cores) {
        parts.push(`${cores}/${threads || cores} потоков`);
      }
      if (speed) {
        parts.push(`@ ${speed} MHz`);
      }
      return parts.join(" ") || null;

    } else if (comp.componentType === "RAM") {

      let capacityStr = formatRamCapacity(comp.capacity);
      let typeStr = comp.metadata?.memoryType;
      let speedStr = comp.speed ? String(comp.speed) : null;


      if (!capacityStr || !typeStr || !speedStr) {
        const extracted = extractRamSpecsFromName(comp.name, comp.model);
        if (extracted) {
          if (!capacityStr && extracted.capacity) capacityStr = extracted.capacity;
          if (!typeStr && extracted.type) typeStr = extracted.type;
          if (!speedStr && extracted.speed) speedStr = extracted.speed;
        }
      }


      const parts = [];
      if (capacityStr) parts.push(capacityStr);
      if (typeStr) parts.push(typeStr);
      if (speedStr) {

        const speedString = String(speedStr);
        if (!speedString.includes('MT/s') && !speedString.includes('MHz')) {
          parts.push(`${speedString} MT/s`);
        } else {
          parts.push(speedString);
        }
      }

      return parts.join(" ") || null;

    } else if (["SSD", "HDD", "NVME"].includes(comp.componentType)) {
      let capacityStr = formatStorageCapacity(comp.capacity);
      let interfaceStr = comp.metadata?.interface;


      if (!capacityStr || !interfaceStr) {
        const extracted = extractStorageSpecsFromName(comp.name, comp.model, comp.componentType);
        if (extracted) {
          if (!capacityStr && extracted.capacity) capacityStr = extracted.capacity;
          if (!interfaceStr && extracted.interface) interfaceStr = extracted.interface;
        }
      }

      const parts = [];
      if (capacityStr) parts.push(capacityStr);
      if (interfaceStr) parts.push(interfaceStr);

      return parts.join(" ") || null;

    } else if (comp.componentType === "NIC") {
      const parts = [];
      if (comp.metadata?.macAddress) parts.push(comp.metadata.macAddress);
      if (comp.metadata?.linkSpeed) parts.push(comp.metadata.linkSpeed);
      return parts.join(" ") || null;

    } else if (comp.componentType === "PSU") {
      if (comp.capacity) return `${comp.capacity}W`;
      return null;

    } else {
      if (comp.firmwareVersion) return `FW: ${comp.firmwareVersion}`;
      return null;
    }
  }
}

module.exports = new PassportService();
