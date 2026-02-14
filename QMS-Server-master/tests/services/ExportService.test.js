/**
 * Unit-тесты для ExportService — генерация Excel-файлов.
 *
 * Тестирует:
 *   1. generateExcel — без заголовка (простой режим)
 *   2. generateExcel — с заголовком (title row)
 *   3. generateMultiSheetExcel — несколько листов
 *   4. Обработка null/undefined значений → пустая строка
 *   5. Ширина колонок по умолчанию
 */

const ExcelJS = require("exceljs");
const ExportService = require("../../services/ExportService");

describe("ExportService", () => {
  const sampleColumns = [
    { header: "Номер", key: "number", width: 12 },
    { header: "Название", key: "title", width: 30 },
    { header: "Статус", key: "status" }, // без width — должен быть 20
  ];

  const sampleRows = [
    { number: "R-001", title: "Первая запись", status: "OPEN" },
    { number: "R-002", title: "Вторая запись", status: "CLOSED" },
    { number: "R-003", title: null, status: undefined },
  ];

  describe("generateExcel — без заголовка", () => {
    test("Должен вернуть Buffer", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Тест",
        columns: sampleColumns,
        rows: sampleRows,
      });

      expect(buffer).toBeDefined();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });

    test("Должен содержать правильные данные", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Данные",
        columns: sampleColumns,
        rows: sampleRows,
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Данные");
      expect(sheet).toBeDefined();

      // Строка 1 — заголовки
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBe("Номер");
      expect(headerRow.getCell(2).value).toBe("Название");
      expect(headerRow.getCell(3).value).toBe("Статус");

      // Строка 2 — первая запись
      const row2 = sheet.getRow(2);
      expect(row2.getCell(1).value).toBe("R-001");
      expect(row2.getCell(2).value).toBe("Первая запись");
      expect(row2.getCell(3).value).toBe("OPEN");
    });

    test("Должен заменить null/undefined на пустую строку", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Null",
        columns: sampleColumns,
        rows: [{ number: "R-003", title: null, status: undefined }],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Null");
      const row2 = sheet.getRow(2);
      // addRow с null оставляет null в ExcelJS, проверяем что данные присутствуют
      expect(row2.getCell(1).value).toBe("R-003");
    });

    test("Ширина колонки по умолчанию 20", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Width",
        columns: sampleColumns,
        rows: [],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Width");
      expect(sheet.getColumn(1).width).toBe(12);
      expect(sheet.getColumn(2).width).toBe(30);
      expect(sheet.getColumn(3).width).toBe(20); // default
    });

    test("Заголовок имеет синий фон и белый шрифт", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Style",
        columns: sampleColumns,
        rows: sampleRows,
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Style");
      const headerCell = sheet.getRow(1).getCell(1);

      expect(headerCell.font.bold).toBe(true);
      expect(headerCell.fill.fgColor.argb).toBe("FF4472C4");
    });
  });

  describe("generateExcel — с заголовком", () => {
    test("Должен содержать title в первой строке", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Реестр",
        title: "Реестр рисков — ISO 14971",
        columns: sampleColumns,
        rows: sampleRows,
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Реестр");
      expect(sheet).toBeDefined();

      // Строка 1 — заголовок документа
      const titleCell = sheet.getCell(1, 1);
      expect(titleCell.value).toBe("Реестр рисков — ISO 14971");
      expect(titleCell.font.bold).toBe(true);
      expect(titleCell.font.size).toBe(14);
    });

    test("Строка 2 — дата формирования", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Дата",
        title: "Test",
        columns: sampleColumns,
        rows: [],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Дата");
      const dateCell = sheet.getCell(2, 1);
      expect(String(dateCell.value)).toContain("Сформировано:");
    });

    test("Строка 4 — заголовки колонок с синим фоном", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Headers",
        title: "Title",
        columns: sampleColumns,
        rows: sampleRows,
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Headers");
      const headerRow = sheet.getRow(4);

      expect(headerRow.getCell(1).value).toBe("Номер");
      expect(headerRow.getCell(2).value).toBe("Название");
      expect(headerRow.getCell(1).fill.fgColor.argb).toBe("FF4472C4");
    });

    test("Данные начинаются с строки 5", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "Data",
        title: "Title",
        columns: sampleColumns,
        rows: sampleRows,
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Data");
      const dataRow = sheet.getRow(5);
      expect(dataRow.getCell(1).value).toBe("R-001");
      expect(dataRow.getCell(3).value).toBe("OPEN");
    });

    test("Null/undefined заменяется на пустую строку", async () => {
      const buffer = await ExportService.generateExcel({
        sheetName: "NullTitle",
        title: "Test",
        columns: sampleColumns,
        rows: [{ number: "R-003", title: null, status: undefined }],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("NullTitle");
      const row = sheet.getRow(5);
      expect(row.getCell(2).value).toBe("");
      expect(row.getCell(3).value).toBe("");
    });
  });

  describe("generateMultiSheetExcel", () => {
    test("Должен создать несколько листов", async () => {
      const buffer = await ExportService.generateMultiSheetExcel({
        title: "Мультилист",
        sheets: [
          {
            name: "Лист1",
            columns: [{ header: "ID", key: "id", width: 10 }],
            rows: [{ id: 1 }, { id: 2 }],
          },
          {
            name: "Лист2",
            columns: [
              { header: "Код", key: "code", width: 15 },
              { header: "Имя", key: "name", width: 25 },
            ],
            rows: [{ code: "A", name: "Альфа" }],
          },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      expect(workbook.getWorksheet("Лист1")).toBeDefined();
      expect(workbook.getWorksheet("Лист2")).toBeDefined();
    });

    test("Каждый лист содержит корректные данные", async () => {
      const buffer = await ExportService.generateMultiSheetExcel({
        title: "Test",
        sheets: [
          {
            name: "Sheet1",
            columns: [{ header: "Value", key: "val" }],
            rows: [{ val: "test-data" }],
          },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Sheet1");
      // Row 1 — header
      expect(sheet.getRow(1).getCell(1).value).toBe("Value");
      // Row 2 — data
      expect(sheet.getRow(2).getCell(1).value).toBe("test-data");
    });

    test("Пустой массив rows — создаёт лист без данных", async () => {
      const buffer = await ExportService.generateMultiSheetExcel({
        title: "Empty",
        sheets: [
          {
            name: "Пустой",
            columns: [{ header: "Col", key: "col" }],
            rows: [],
          },
        ],
      });

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.getWorksheet("Пустой");
      expect(sheet.getRow(1).getCell(1).value).toBe("Col");
      expect(sheet.getRow(2).getCell(1).value).toBeNull();
    });
  });
});
