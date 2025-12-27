import { body, validationResult } from 'express-validator';

import ObjectType from '../models/objectType.model.js';
import Organization from '../models/organization.model.js';
import Person from '../models/person.model.js';
import User from '../models/user.model.js';

export const validateRegister = [

    body('code').isLength({min: 4, max:10}).withMessage('Code must be 3 to 10 characters only.'),

    body('organizationName').trim().escape().isLength({min: 5, max: 100}).withMessage('Tenant Name must be 5 to 100 characters only.'),

    body('address').trim().escape().isLength({max: 250}).withMessage('Address must be below 250 characters only.'),

    body('loginName').trim().escape().isLength({min:5, max: 50}).withMessage('Login Name must be 5 to 50 characters only.'),

    body('password').trim().escape().isLength({min: 1, max: 100}).withMessage('Password must be 1 to 100 characters only.'),

    body('personName').trim().escape().isLength({min: 5, max: 200}).withMessage('Contact Person Name must be 5 to 200 characters only.'),

    body('mobileNo').trim().escape().isLength({max: 15}).withMessage('Mobile No. muster be below 15 characters only.'),

    body('personAddress').trim().escape().isLength({max: 250}).withMessage('Contact Person Address must be below 250 characters only.'),
];

export const validateOrganization = [

    body('code').isLength({min: 4, max:10}).withMessage('Code must be 3 to 10 characters only.'),

    body('organizationName').trim().escape().isLength({min: 5, max: 10}).withMessage('Organization Name must be 5 to 100 characters only.'),

    body('address').trim().escape().isLength({max: 250}).withMessage('Address must be below 250 characters only.'),
];

export const registerOrganization = async (request, response)=>{

    const result = validationResult(request);
    if (!result.isEmpty()) {
        return response.json({status: false, data: null, message: 'Registration is failed', errors: result.errors });
    }

    const objectType = new ObjectType({"tenantId": "", "featureCode": "org", "code": "tenant", "typeName": "Tenant", "isEditable": false});
    const tenant = new Organization(request.body);
    const person = new Person(request.body);
    const user = new User(request.body);

    objectType.tenantId = tenant._id;
    objectType.createdByUserId = user._id;
    
    tenant.tenantId = tenant._id;
    tenant.parentId = tenant._id;
    tenant.organizationTypeId = objectType._id;
    tenant.createdByUserId = user._id;

    person.tenantId = tenant._id;
    person.organizationId = tenant._id;
    person.address = request.body.personAddress;
    person.user = user._id;
    person.createdByUserId = user._id;

    user.tenantId = tenant._id;
    user.organizationId = tenant._id;
    user.userType = 'admin';
    user.createdByUserId = user._id;

//    const session = await mongoose.startSession();
    try{
//        await session.startTransaction();
        await ObjectType.create(objectType);
        await Organization.create(tenant);
        await Person.create(person);
        await User.create(user);

//        await session.commitTransaction();
    }
    catch(err) {   
//        await session.abortTransaction();    
    }
    finally{
//        await session.endSession();
    }

    return response.json({status: true, data: {cli: tenant, person, user}, message: 'Registration has done successfully.', errors:[]});

}

export const createOrganization = async (request, response) => {

    const result = validationResult(request);
    if (!result.isEmpty()) {
        return response.json({status: false, data: null, message: 'Organization creation failed', errors: result.errors });
    }

    const orgNew = request.body;
    orgNew.createdByUserId = request.user?.id;

    await Organization.create(request.body);
    return response.json({status: true, data: request.body, message: 'Organization created successfully.'})
}

export const updateOrganization = async (request, response) => {

    const { id } = await request.params ;
    
    await Organization.findByIdAndUpdate(id, 
        { $set: { code: request.body.code, organizationName: request.body.organizationName, address: request.body.address, modifiedByUserId: request.user?.id } }, 
        {new: true});

    response.json({status: true, data: null, message: 'Organization updated successfully.'});
}

export const updateOrganizationLogo = async (request, response)=>{

    const orgUpdate = await Organization.findById( request.params.id );

    if (request.file) {
        orgUpdate.logo = { data: request.file.buffer, contentType: request.file.mimetype, };
        orgUpdate.modifiedByUserId = request.user?.id;
    }

    await orgUpdate.save();

    response.json({status: true, data: orgUpdate, message: 'Role updated successfully.'});
}

export const deleteOrganization = async (request, response) => {
    const { id } = request.params;
    await Organization.findByIdAndDelete(id);
    response.json({status: true, data: null, message: 'Organization deleted successfully.'});
}

export const createOrganizationsBulk = async (request, response)=>{

    try{
        const orgsInserted = await Organization.insertMany(request.body);
        response.status(201).json(orgsInserted);
    }
    catch(err) {
        response.json({status: false, data: request.body, message: err});
    }
    finally{
//        mongoose.disconnect();
    }

}

export const getOrganizations = async (request, response) => {
    const organizations = await Organization.find( {/*organizationTypeId: { $ne: 1 }*/} );
    return response.json(organizations);
}

export const getOrganization = async (request, response) => {
    const { id } = await request.params ;
    const organization = await Organization.findById(id).lean();
//res.json({ result: data, totalRows: totalRows, totalPages: Math.ceil(totalRows/pageSize) });

    return response.json(organization);
}

export const getOrganizationLogo = async (request, response) => {

    const { id } = await request.params ; 
    const org = await Organization.findById(id);

    response.set("Content-Type", org.logo.contentType);

    response.send(org.logo.data);
}

export const getOrganizationsByPagination = async (req, res) => {

  try {
    const { pageSize = 10, pageNo = 1, filterRules, sortrules, search } = req.params;

    let filterOr = {};
    if (search && search !== "_") {
      filterOr = {
        $or: [
          { code: { $regex: search, $options: "i" } },
          { organizationName: { $regex: search, $options: "i" } },
        ],
      };
    }

    const sortRules = sortrules ? JSON.parse(sortrules) : [];
    const sortObj = {};
    sortRules.forEach((rule) => {
      sortObj[rule.field] = rule.order === "asc" ? 1 : -1;
    });

    const filterRules2 = filterRules ? JSON.parse(filterRules) : [];
    const filterAnd = {};
    filterRules2.forEach((rule) => {
      filterAnd[rule.field] = { $regex: rule.value, $options: "i" };
    });

    const exprNotEqual = { $expr: { $ne: ["$_id", "$parentId"] } };

    const filter = {
      $and: [
        exprNotEqual,
        ...(Object.keys(filterAnd).length ? [filterAnd] : []),
        ...(Object.keys(filterOr).length ? [filterOr] : []),
      ],
    };


  const pipeline = [
      { $match: filter },
      { $lookup: { from: "organizations", localField: "parentId", foreignField: "_id", as: "parent"}},
      { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },

      { $project: { _id: 1, code: 1, organizationName: 1, parentId: 1, parentName: "$parent.organizationName", description: 1, }},
    /*  { $sort: sortObj },*/
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNo - 1) * parseInt(pageSize) },
      { $limit: parseInt(pageSize) },
    ];

    const [data, totalRows] = await Promise.all([
      Organization.aggregate(pipeline),
      Organization.countDocuments(filter),
    ]);

    res.json({
      result: data,
      totalRows,
      totalPages: Math.ceil(totalRows / pageSize),
    });
  } catch (error) {
    console.error("Error in getOrganizationsByPagination:", error);
    res.status(500).json({ error: error.message });
  }
};

