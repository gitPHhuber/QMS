/**
 * ExportService.js — Centralized Excel export service
 * Uses exceljs to generate .xlsx files for any QMS module data.
 */

const ExcelJS = require("exceljs");

class ExportService {
  /**
   * Generate an Excel workbook from a configuration object.
   *
   * @param {object} config
   * @param {string} config.sheetName - Worksheet name
   * @param {Array<{header: string, key: string, width?: number}>} config.columns
   * @param {Array<object>} config.rows - Data rows (plain objects matching column keys)
   * @param {string} [config.title] - Optional title row at the top
   * @returns {Promise<Buffer>} Excel file as buffer
   */
  static async generateExcel({ sheetName, columns, rows, title }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ASVO-QMS";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(sheetName);

    let startRow = 1;

    // Optional title row
    if (title) {
      sheet.mergeCells(1, 1, 1, columns.length);
      const titleCell = sheet.getCell(1, 1);
      titleCell.value = title;
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: "center" };

      // Date row
      sheet.mergeCells(2, 1, 2, columns.length);
      const dateCell = sheet.getCell(2, 1);
      dateCell.value = `Сформировано: ${new Date().toLocaleString("ru-RU")}`;
      dateCell.font = { size: 10, italic: true, color: { argb: "FF888888" } };
      dateCell.alignment = { horizontal: "center" };

      startRow = 4;
    }

    // Set columns
    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // If we have a title, we need to move the header row
    if (title) {
      // Remove auto-generated header at row 1
      sheet.spliceRows(1, 0); // This won't work well, let's use a different approach

      // Actually, let's build it manually
      const ws = workbook.addWorksheet(sheetName + "_data");
      workbook.removeWorksheet(sheet.id);

      const ws2 = workbook.addWorksheet(sheetName);
      workbook.removeWorksheet(ws.id);

      // Title
      ws2.mergeCells(1, 1, 1, columns.length);
      const tc = ws2.getCell(1, 1);
      tc.value = title;
      tc.font = { bold: true, size: 14 };
      tc.alignment = { horizontal: "center" };

      // Date
      ws2.mergeCells(2, 1, 2, columns.length);
      const dc = ws2.getCell(2, 1);
      dc.value = `Сформировано: ${new Date().toLocaleString("ru-RU")}`;
      dc.font = { size: 10, italic: true, color: { argb: "FF888888" } };
      dc.alignment = { horizontal: "center" };

      // Empty row
      // Header row at row 4
      const headerRow = ws2.getRow(4);
      columns.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = col.header;
        cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Set column widths
      columns.forEach((col, i) => {
        ws2.getColumn(i + 1).width = col.width || 20;
      });

      // Data rows starting at row 5
      rows.forEach((row, ri) => {
        const dataRow = ws2.getRow(5 + ri);
        columns.forEach((col, ci) => {
          const cell = dataRow.getCell(ci + 1);
          cell.value = row[col.key] ?? "";
          cell.border = {
            top: { style: "thin", color: { argb: "FFD0D0D0" } },
            bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
            left: { style: "thin", color: { argb: "FFD0D0D0" } },
            right: { style: "thin", color: { argb: "FFD0D0D0" } },
          };
          if (ri % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
          }
        });
      });

      return workbook.xlsx.writeBuffer();
    }

    // Simple mode without title
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    rows.forEach((row) => {
      sheet.addRow(row);
    });

    // Style data rows
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFD0D0D0" } },
          bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
          left: { style: "thin", color: { argb: "FFD0D0D0" } },
          right: { style: "thin", color: { argb: "FFD0D0D0" } },
        };
        if (rowNumber % 2 === 0) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
        }
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  /**
   * Generate a multi-sheet Excel workbook.
   *
   * @param {object} config
   * @param {string} config.title - Document title
   * @param {Array<{name: string, columns: Array, rows: Array}>} config.sheets
   * @returns {Promise<Buffer>}
   */
  static async generateMultiSheetExcel({ title, sheets }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ASVO-QMS";
    workbook.created = new Date();

    for (const sheetDef of sheets) {
      const ws = workbook.addWorksheet(sheetDef.name);

      // Header row
      const headerRow = ws.getRow(1);
      sheetDef.columns.forEach((col, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = col.header;
        cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        ws.getColumn(i + 1).width = col.width || 20;
      });

      // Data rows
      sheetDef.rows.forEach((row, ri) => {
        const dataRow = ws.getRow(2 + ri);
        sheetDef.columns.forEach((col, ci) => {
          const cell = dataRow.getCell(ci + 1);
          cell.value = row[col.key] ?? "";
          cell.border = {
            top: { style: "thin", color: { argb: "FFD0D0D0" } },
            bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
            left: { style: "thin", color: { argb: "FFD0D0D0" } },
            right: { style: "thin", color: { argb: "FFD0D0D0" } },
          };
          if (ri % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } };
          }
        });
      });
    }

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = ExportService;
