
import {body, validationResult} from 'express-validator';
import bcrypt from "bcrypt";

import Person from "../models/person.model.js";
import User from '../models/user.model.js';
import mongoose from 'mongoose';

export const validatePerson = [
    body('personName').trim().escape().isLength({min: 5, max: 200}).withMessage('Contact Person Name must be 5 to 200 characters only.'),
    body('mobileNo').trim().escape().isLength({max: 15}).withMessage('Mobile No. muster be below 15 characters only.'),
    body('address').trim().escape().isLength({max: 250}).withMessage('Contact Person Address must be below 250 characters only.'),
//    body('user.loginName').trim().escape().isLength({min:5, max: 50}).withMessage('Login Name must be 5 to 50 characters only.'),
//    body('user.password').trim().escape().isLength({min: 1, max: 100}).withMessage('Password must be 1 to 100 characters only.')
];

export const createPerson = async (request, response)=>{

    const data = request.body; 
    const hash = await bcrypt.hash(request.body.password, 12);
    user.password = hash;

    const user = new User(data.user); 
    const person = new Person(data);
    person.user = user._id;
    user.tenantId = person.tenantId;
    user.organizationId = person.organizationId;
    
    const result = validationResult(request);
    if (!result.isEmpty()) {   
        return response.json({status: false, data: request.body, message: 'Person created successfully.', errors: result.errors });
    } 

    const session = await mongoose.startSession();
    try {
        await session.startTransaction();

        await User.create(user); 
        await Person.create(person); 

        await session.commitTransaction();
    }
    catch(error){       
        await session.abortTransaction();
    }
    finally{
        await session.endSession();
    }

    return response.json({status: true, data: {user: user, person: person}, message: 'Person created successfully.', errors:[]});
}

export const updatePerson = async (request, response) => {

    const personUpdate = await Person.findById(request.params.id);
    personUpdate.code = request.body.code;
    personUpdate.personName = request.body.personName;
    personUpdate.mobileNo = request.body.mobileNo;
    personUpdate.address = request.body.address;

    const userUpdate = await User.findById( personUpdate.user );
    userUpdate.loginName = request.body.user.loginName;
    userUpdate.password = request.body.user.password;
    userUpdate.roles = request.body.user.roles;
    userUpdate.privileges = request.body.user.privileges;

    personUpdate.save();
    userUpdate.save();

    response.json({status: true, data: null, message: 'Person updated successfully.'});
}

export const updateUserAvatar = async (request, response)=>{

    const userUpdate = await User.findById( request.params.id );

    if (request.file) {
        userUpdate.avatar = {
            data: request.file.buffer,
            contentType: request.file.mimetype,
        };
    }

    await userUpdate.save();

    response.json({status: true, data: null, message: 'Role updated successfully.'});
}

export const deletePerson = async (request, response) => {
    const { id } = await request.params;
    const { user } = await Person.findById(id);

    await User.findByIdAndDelete(user);
    await Person.findByIdAndDelete(id);

    response.json({status: true, data: null, message: 'Person deleted successfully.'});
}

export const createPersonsBulk = async (request, response)=>{
    const personsInserted = await Person.insertMany(request.body);
    response.status(201).json(personsInserted);
}

export const getPersons = async (request, response) => {
    const persons = await Person.find().populate('user').lean();

    return response.json(persons);
}

export const getPerson = async (request, response) => {
    const { id } = request.params;
    const person = await Person.findById(id).populate('user');

//    setTimeout(() => {
        return response.json(person);
 //   }, 5000);
    
}

export const getUserAvatar = async (request, response) => {

    const { id } = await request.params ; 
    const user = await User.findById(id);

    response.set("Content-Type", user.avatar.contentType);

    response.send(user.avatar.data);
}

export const getPersonsByPagination = async (req, res) => {

  try {
    const { pageSize, pageNo, filterRules, sortrules, search } = req.params;

    const pageNoNum = Number(pageNo) || 1;
    const pageSizeNum = Number(pageSize) || 10;

    const filterOr = (search && search !== "_") ? {
      $or: [
        { code: { $regex: search, $options: "i" } },
        { personName: { $regex: search, $options: "i" } },
        { "user.loginName": { $regex: search, $options: "i" } },
        { "organization.organizationName": { $regex: search, $options: "i" } }
      ]
    } : {};

    let filterAnd = {};
    try {
      const rules = filterRules ? JSON.parse(filterRules) : [];
      rules.forEach(r => filterAnd[r.field] = { $regex: r.value, $options: "i" });
    } catch(e) { filterAnd = {}; }

    let sortObj = {};
    try {
      const rules = sortrules ? JSON.parse(sortrules) : [];
      rules.forEach(r => sortObj[r.field] = r.order === "asc" ? 1 : -1);
    } catch(e) { sortObj = {}; }

    const basePipeline = [
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      { $lookup: { from: "organizations", localField: "organizationId", foreignField: "_id", as: "organization" }},
      { $unwind: { path: "$organization", preserveNullAndEmptyArrays: true } },
       
      { $match: { $and: [filterAnd, filterOr] } }
    ];

    const dataPipeline = [ 
      ...basePipeline, 
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNoNum - 1) * pageSizeNum },
      { $limit: pageSizeNum }
    ];

    const countPipeline = [...basePipeline, { $count: "total" }];

    const [data, countResult] = await Promise.all([
      Person.aggregate(dataPipeline),
      Person.aggregate(countPipeline)
    ]);

    const totalRows = countResult.length ? countResult[0].total : 0;

    res.json({
      result: data,
      totalRows,
      totalPages: Math.ceil(totalRows / pageSizeNum)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
