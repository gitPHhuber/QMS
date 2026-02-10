

function calculateDuration(startDate) {
  if (!startDate) return null;
  const start = new Date(startDate);
  const now = new Date();
  return Math.round((now - start) / (1000 * 60));
}

module.exports = {
  calculateDuration
};
