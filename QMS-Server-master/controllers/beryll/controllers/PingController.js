

const PingController = require("../controllers/beryll/controllers/PingController");


router.get(
  "/monitoring/stats",
  ...protect,
  checkAbility("beryll.view"),
  PingController.getMonitoringStats.bind(PingController)
);


router.get(
  "/monitoring/status",
  ...protect,
  checkAbility("beryll.view"),
  PingController.getCachedStatus.bind(PingController)
);


router.get(
  "/monitoring/ping/:id",
  ...protect,
  checkAbility("beryll.view"),
  PingController.pingServer.bind(PingController)
);


router.post(
  "/monitoring/ping-all",
  ...protect,
  checkAbility("beryll.work"),
  PingController.pingAllServers.bind(PingController)
);


router.get(
  "/monitoring/servers/online",
  ...protect,
  checkAbility("beryll.view"),
  PingController.getOnlineServers.bind(PingController)
);


router.get(
  "/monitoring/servers/offline",
  ...protect,
  checkAbility("beryll.view"),
  PingController.getOfflineServers.bind(PingController)
);


router.post(
  "/monitoring/clear-cache",
  ...protect,
  checkAbility("beryll.manage"),
  PingController.clearCache.bind(PingController)
);
