
import Privilege from "../models/privilege.model.js";
import { body } from "express-validator";

export const privilegeCreate = async (request, response) => {
    const data = request.body;
    const privilegeInserted = data;

    await Privilege.create(privilegeInserted);
    response.json({status: true, data: privilegeInserted, message: 'Privileges created successfully.'});
}

export const getPrivileges = async (request, response) => {
    const privileges = await Privilege.find();
    response.json(privileges);
}
