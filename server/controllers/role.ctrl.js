
import Role from '../models/role.model.js';
import { body, validationResult } from 'express-validator';

export const validateRole = [
    body('code').trim().escape().isLength({max: 50}).withMessage('Code must be below 50 characters only.'),
    body('rolename').trim().escape().isLength({min: 1, max: 100}).withMessage('Name must be 1 to 100 characters only.')
];

export const createRole = async (request, response)=>{

    const result = validationResult(request);    
    if (!result.isEmpty()) {  
        return response.json({status: false, data: request.body, message: 'Role creation is failed', errors: result.errors });
    } 

    const roleInserted = new Role(request.body)
    await Role.create(roleInserted);
    response.json({status: true, data: roleInserted, message: 'Role saved successfully.', errors: []});
}

export const updateRoleIcon = async (request, response)=>{

console.log('role updateroleionc   :', request.params.id, request.file);

    const roleUpdate = await Role.findById( request.params.id );

    if (request.file) {
        roleUpdate.icon = {
            data: request.file.buffer,
            contentType: request.file.mimetype,
        };
    }

    await roleUpdate.save();

    response.json({status: true, data: null, message: 'Role updated successfully.'});
}

export const updateRole = async (request, response)=>{

    const roleUpdate = await Role.findById( request.params.id );
    roleUpdate.code = request.body.code;
    roleUpdate.rolename = request.body.rolename;
    roleUpdate.privileges = request.body.privileges;

    roleUpdate.save();

    response.json({status: true, data: null, message: 'Role updated successfully.'});
}

export const deleteRole = async (request, response)=>{

    const { id } = await request.params ; 
    await Role.findByIdAndDelete(id);
    response.json({status: true, data: null, message: 'Role deleted successfully.'});
}

export const createRolesBulk = async (request, response)=>{
    const rolesInserted = await Role.insertMany(request.body);
    response.status(201).json(rolesInserted);
} 

export const getRoles = async (request, response) => {

    const roles = await Role.find({});
    response.json(roles);
}

export const getRole = async (request, response) => {

    const { id } = await request.params ; 
    const role = await Role.findById(id).populate('privileges');

    response.json(role);
}

export const getRoleIcon = async (request, response) => {

    const { id } = await request.params ; 
    const role = await Role.findById(id).populate('privileges');

    response.set("Content-Type", role.icon.contentType);

    response.send(role.icon.data);
}

export const getRolesByPagination = async (req, res) => {

    const {pageSize, pageNo, filterRules, sortrules, search } = await req.params ;

    let filterOr = {};

    if (search === '_') 
        filterOr = {}
    else if (search && typeof search === "string") {
      filterOr = {
        $or: [
          { code: { $regex: search, $options: "i" } },
          { rolename: { $regex: search, $options: "i" } }
        ]
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

   const filter = { $and: [filterAnd, filterOr]};

   const pipeline = [
      { $match: filter },

      { $lookup: { from: "organizations", localField: "organizationId", foreignField: "_id", as: "org" }},
      { $unwind: { path: "$org", preserveNullAndEmptyArrays: true } },

      { $project: { _id: 1, code: 1, rolename: 1, organizationName: 1, organizationId:"$org._id", organizationName: "$org.organizationName", description: 1}},
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNo - 1) * parseInt(pageSize) },
      { $limit: parseInt(pageSize) },
    ];

    const [data, totalRows] = await Promise.all([
      Role.aggregate(pipeline),
      Role.countDocuments(filter)
    ]);

    res.json({ result: data, totalRows: totalRows, totalPages: Math.ceil(totalRows/pageSize) });
}