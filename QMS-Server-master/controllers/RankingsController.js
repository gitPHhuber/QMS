class RankingsController {
  async getStats(req, res, next) {
    try {
      return res.json({
        users: [],
        teams: [],
      });
    } catch (error) {
      return next(error);
    }
  }

  async getUserDetails(req, res, next) {
    try {
      return res.json({
        user: null,
        stats: {
          output: 0,
          defects: 0,
          efficiency: 0,
        },
        history: [],
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new RankingsController();
