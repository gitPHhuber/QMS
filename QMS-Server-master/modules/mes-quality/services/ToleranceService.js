class ToleranceService {
  /**
   * Evaluate whether a numeric measurement is within tolerance.
   *
   * @param {number|null} numericValue  - The measured value
   * @param {number|null} lowerLimit    - Lower specification limit
   * @param {number|null} upperLimit    - Upper specification limit
   * @returns {'GREEN'|'YELLOW'|'RED'|null}
   */
  static evaluate(numericValue, lowerLimit, upperLimit) {
    if (numericValue === null || numericValue === undefined) return null;
    if (lowerLimit === null && upperLimit === null) return null;

    const withinSpec =
      (lowerLimit === null || numericValue >= lowerLimit) &&
      (upperLimit === null || numericValue <= upperLimit);

    if (withinSpec) {
      const range = (upperLimit || 0) - (lowerLimit || 0);
      if (range === 0) return "GREEN";
      const margin = range * 0.1;
      const nearLower = lowerLimit !== null && numericValue < lowerLimit + margin;
      const nearUpper = upperLimit !== null && numericValue > upperLimit - margin;
      return nearLower || nearUpper ? "YELLOW" : "GREEN";
    }

    return "RED";
  }
}

module.exports = ToleranceService;
