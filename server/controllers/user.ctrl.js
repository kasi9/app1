import User from "../models/user.model.js";
import Person from "../models/person.model.js";
import Privilege from '../models/privilege.model.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

export const userRolesMap = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.create([req.body.user], { session });
        await Person.create([{ ...req.body.person, user: user[0]._id }], { session });

        await session.commitTransaction();
        res.json({ success: true });
    } catch (err) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        session.endSession();
    }
};

/*export const userBulkInsert = async (request, response)=>{
    const usersInserted = await User.insertMany(request.body);
    response.status(201).json(usersInserted);
}*/

export const getToken = async (req, res) => {
    try {
        const {userName, password} = req.body;

        if (!userName || !password) {
            return res.status(400).json({ success: false, message: "Username and password are required" });
        }

        const user = await User.findOne({ loginName: userName });
        if (!user) {
            return res.status(200).json({ success: false, responseType: 'err', message: 'User not found.', data: null, errorCode: '', errors: [], requestId: '' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const person = await Person.findOne({ user: user._id });
        const personName = person?.personName || user.loginName;

        if (!process.env.JWT_SECRET_KEY) {
            throw new Error("JWT_SECRET_KEY is not configured");
        }

        const token = jwt.sign({ id: user._id/*, loginName: user.loginName, userFullName: personName*/, tenantId: user.tenantId, organizationId: user.organizationId, },
        process.env.JWT_SECRET_KEY, { expiresIn: "1h" }) ;

        return res.json({ success: true, responseType: 'msg', message: "Logged in successfully", data: { token, user: { id: user._id, name: personName }, }, errorCode: '', errors: [], requestId: '', });
    } catch (error) {
        return res.status(500).json({ success: false, responseType: 'err', message: error.message, data: null, errorCode: '', errors: [], requestId: '', });
    }
    finally {}
};

export const authorizeUser = (req, res, next) => {

    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, responseType: 'err', message: 'Unauthorized user.', data: null, errorCode: '', errors: [], requestId: '' }); 
    }

    const token = authHeader.replace("Bearer ", "").trim();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, responseType: 'err', message: 'Unauthorized user.', data: null, errorCode: '', errors: [], requestId: '' }); 
    }
};

/*export const getPrivileges = async (req, res) => {

    const distinctPrivileges = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId('68db9e050629152510e89faa') } },
        { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
        { $unwind: "$roles" },
        { $unwind: "$roles.privileges" },
        { $group: { _id: "$roles.privileges.code", code: { $first: "$roles.privileges.code" }, name: { $first: "$roles.privileges.name" }, 
            actions: { $addToSet: "$roles.privileges.actions" } } },
        { $project: { code: 1, name: 1, actions: { $reduce: { input: "$actions", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } } } }
    ]);

    return res.json(distinctPrivileges);
}*/

export const getPrivilegesByUserForm = async (req, res) => {
    const userId = req.user.id;
    const formCode = req.body.formCode ;
    const user = await User.findById(userId);

    if (user.userType === 'admin') {
        const distinctPrivileges = await Privilege.findOne({ code: formCode }, { _id: 0, actions: 1 });
        return res.json(distinctPrivileges);
    }
    else {
        const distinctPrivileges = await User.aggregate([
            { $match: { tenantId: new mongoose.Types.ObjectId(user.tenantId), _id: new mongoose.Types.ObjectId(userId)}},
            { $lookup: { from: "roles", localField: "roles", foreignField: "_id", as: "roles" } },
            { $unwind: "$roles" },
            { $unwind: "$roles.privileges" },
            { $match: { "roles.privileges.code": formCode } },
            { $group: { _id: "$roles.privileges.code", code: { $first: "$roles.privileges.code" }, name: { $first: "$roles.privileges.name" }, 
                actions: { $addToSet: "$roles.privileges.actions" } } },
            { $project: { code: 1, name: 1, actions: { $reduce: { input: "$actions", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } } } }
        ]);

        return res.json(distinctPrivileges[0]);
    }   
}
