// Milestone thresholds — emitted to creator room when totalResponses hits these values
exports.checkMilestone = (totalResponses) => {
  return [10, 25, 50, 100, 250, 500].find((m) => m === totalResponses) || null;
};