const geoService = require("../services/geo.service");

async function getClientIp(req) {
  // X-Forwarded-For handling for proxies
  const xff = req.headers["x-forwarded-for"];
  if (xff) return xff.split(",")[0].trim();
  // fallback
  return req.ip || req.connection?.remoteAddress || null;
}

async function requestLogger(req, res, next) {
  const ip = await getClientIp(req);
  const geo = await geoService.lookup(ip).catch(() => null);

  const log = {
    time: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    ip,
    geo,
  };

  console.log(JSON.stringify(log));
  next();
}

module.exports = requestLogger;
