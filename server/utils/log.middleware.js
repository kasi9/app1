import Log from '../models/log.model.js' ;

const logMiddleware = (req, res, next) => {
  const start = Date.now();

  const originalSend = res.send;

  res.send = async function (body) {
    try {
      await Log.create({ tenantId: req.user?.tenantId, userId: req.user?.id, method: req.method, url: req.originalUrl, status: res.statusCode, ip: req.ip
        , responseTime: Date.now() - start, success: toJson(body).success, responseType: toJson(body).responseType, errorCode: toJson(body).errorCode
        , requestId: res.requestId,requestBody: req.body, responseBody: safeJson(body), });
    } catch (err) {
      console.error("Log save error:", err.message);
    }

    return originalSend.call(this, body);
  };

  next();
};

export default logMiddleware;

function safeJson(data) {
  try {
    return typeof data === "string" ? data : JSON.stringify(data);
  } catch {
    return "[unserializable-response]";
  }
}

function toJson(value) {
  if (typeof value === "object") return value; // already JSON

  try {
    return JSON.parse(value);   // convert string → JSON
  } catch {
    return value;               // return original if not valid JSON
  }
}
