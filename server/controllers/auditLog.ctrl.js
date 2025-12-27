import auditLog from "../models/auditLog.model.js";

export const createLog = async (request, response) => {
console.log(request.user);
    const al = auditLog({ userId: "6900f4cfd14ed672f46a12f6", message: request.body.action})
    await auditLog.create(al);

    return response.json({status: true, data: request.body, message: 'Logged successfully.'})
}

