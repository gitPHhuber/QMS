const { AcceptanceTest, AcceptanceTestItem } = require("../models/MesQuality");

class CertificatePdfService {
  /**
   * Generate certificate data for a passed acceptance test.
   * TODO: Integrate with pdfmake for actual PDF generation
   *
   * @param {number} testId - AcceptanceTest id
   * @returns {object} Certificate data object
   */
  static async generateCertificate(testId) {
    const test = await AcceptanceTest.findByPk(testId, {
      include: [
        { model: AcceptanceTestItem, as: "items" },
      ],
    });

    if (!test) throw new Error("Test not found");

    const passedItems = (test.items || []).filter((i) => i.result === "PASS");
    const totalItems = (test.items || []).length;

    return {
      certificateType: "ACCEPTANCE_TEST_CERTIFICATE",
      testNumber: test.testNumber,
      productId: test.productId,
      serialNumber: test.serialNumber,
      lotNumber: test.lotNumber,
      batchSize: test.batchSize,
      status: test.status,
      completedAt: test.completedAt,
      decisionAt: test.decisionAt,
      decisionNotes: test.decisionNotes,
      summary: {
        totalItems,
        passedItems: passedItems.length,
        passRate: totalItems > 0 ? ((passedItems.length / totalItems) * 100).toFixed(1) : "0.0",
      },
      items: (test.items || []).map((item) => ({
        name: item.name,
        testType: item.testType,
        criteria: item.criteria,
        actualValue: item.actualValue,
        numericValue: item.numericValue,
        result: item.result,
        unit: item.unit,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate protocol data for an acceptance test.
   * TODO: Integrate with pdfmake for actual PDF generation
   *
   * @param {number} testId - AcceptanceTest id
   * @returns {object} Protocol data object
   */
  static async generateProtocol(testId) {
    const test = await AcceptanceTest.findByPk(testId, {
      include: [
        { model: AcceptanceTestItem, as: "items" },
      ],
    });

    if (!test) throw new Error("Test not found");

    return {
      protocolType: "ACCEPTANCE_TEST_PROTOCOL",
      testNumber: test.testNumber,
      productId: test.productId,
      serialNumber: test.serialNumber,
      lotNumber: test.lotNumber,
      batchSize: test.batchSize,
      status: test.status,
      submittedAt: test.submittedAt,
      startedAt: test.startedAt,
      completedAt: test.completedAt,
      decisionAt: test.decisionAt,
      decisionNotes: test.decisionNotes,
      isRetest: test.isRetest,
      retestReason: test.retestReason,
      notes: test.notes,
      items: (test.items || []).map((item) => ({
        itemOrder: item.itemOrder,
        name: item.name,
        testType: item.testType,
        criteria: item.criteria,
        lowerLimit: item.lowerLimit,
        upperLimit: item.upperLimit,
        nominalValue: item.nominalValue,
        unit: item.unit,
        actualValue: item.actualValue,
        numericValue: item.numericValue,
        result: item.result,
        isCritical: item.isCritical,
        testedAt: item.testedAt,
        notes: item.notes,
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}

module.exports = CertificatePdfService;
