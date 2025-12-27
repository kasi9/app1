import Link from '../models/link.model.js';

export const createLink = async (request, response) => {
console.log('fadsfdf: Links ', request.body);
    const linkNew = request.body;
//    linkNew.createdByUserId = request.user?.id;

    await Link.create(request.body);
    return response.json({status: true, data: request.body, message: 'Link created successfully.'})
}

export const updateLink = async (request, response) => {

    const { id } = await request.params ;
    
    await Link.findByIdAndUpdate(id, 
        { $set: { code: request.body.code, linkName: request.body.linkName, title: request.body.title, url: request.body.url, address: request.body.address, modifiedByUserId: request.user?.id } }, 
        {new: true});

    response.json({status: true, data: null, message: 'Link updated successfully.'});
}

export const deleteLink = async (request, response) => {
    const { id } = request.params;
    await Link.findByIdAndDelete(id);
    response.json({status: true, data: null, message: 'Link deleted successfully.'});
}

export const getLinks = async (request, response) => {
    const links = await Link.find( {} );
    return response.json(links);
}

export const getLink = async (request, response) => {
    const { id } = await request.params ;
    const link = await Link.findById(id).lean();

    return response.json(link);
}

export const getLinksByPagination = async (req, res) => {

  try {
    const { pageSize = 10, pageNo = 1, filterRules, sortrules, search } = req.params;

    let filterOr = {};
    if (search && search !== "_") {
      filterOr = {
        $or: [
          { code: { $regex: search, $options: "i" } },
          { linkName: { $regex: search, $options: "i" } },
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
      { $project: { _id: 1, code: 1, linkName: 1, title: 1, address: 1, }},
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNo - 1) * parseInt(pageSize) },
      { $limit: parseInt(pageSize) },
    ];

    const [data, totalRows] = await Promise.all([
      Link.aggregate(pipeline),
      Link.countDocuments(filter),
    ]);
console.log('get place pagin', data);
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
