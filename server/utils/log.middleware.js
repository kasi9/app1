import Log from "../models/log.model.js";

const logMiddleware = (req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function (body) {
        const responseTime = Date.now() - start;
        const parsed = safeParse(body);

        const logData = { tenantId: req.user?.tenantId, userId: req.user?.id, method: req.method, url: req.originalUrl, status: res.statusCode,
            ip: req.ip, responseTime, requestId: res.requestId, success: parsed?.success ?? res.statusCode < 400, responseType: parsed?.responseType,
            errorCode: parsed?.errorCode, requestBody: sanitize(req.body), responseBody: trimResponse(body)
        };

        Log.create(logData).catch(err => console.error("Log save failed:", err.message) );

        return originalSend.call(this, body);
    };

    next();
};

export default logMiddleware;

function safeParse(data) {
    try {
        if (typeof data === "object") return data;
            return JSON.parse(data);
    } catch {
        return null;
    }
}

function sanitize(body) {
    if (!body || typeof body !== "object") return body;

    const clone = { ...body };

    delete clone.password;
    delete clone.token;
    delete clone.accessToken;
    delete clone.refreshToken;

    return clone;
}

function trimResponse(data) {
    try {
        const str = (typeof data === "string") ? data : JSON.stringify(data);
        // limit size to 5KB
        return str.length > 5000 ? (str.substring(0, 5000) + "...") : str;
    } catch {
        return "[unserializable]";
  }
}
