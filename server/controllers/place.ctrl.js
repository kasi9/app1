import Place from '../models/place.model.js';

export const createPlace = async (request, response) => {
console.log('fadsfdf: plases ', request.body);
    const placeNew = request.body;
    placeNew.createdByUserId = request.user?.id;

    await Place.create(request.body);
    return response.json({status: true, data: request.body, message: 'Place created successfully.'})
}

export const updatePlace = async (request, response) => {

    const { id } = await request.params ;
    
    await Place.findByIdAndUpdate(id, 
        { $set: { code: request.body.code, placeName: request.body.placeName, address: request.body.address, latitude: request.body.latitude, longitude: request.body.longitude, modifiedByUserId: request.user?.id } }, 
        {new: true});

    response.json({status: true, data: null, message: 'Place updated successfully.'});
}

export const deletePlace = async (request, response) => {
    const { id } = request.params;
    await Place.findByIdAndDelete(id);
    response.json({status: true, data: null, message: 'Place deleted successfully.'});
}

export const getPlaces = async (request, response) => {
    const places = await Place.find( {} );
    return response.json(places);
}

export const getPlace = async (request, response) => {
    const { id } = await request.params ;
    const place = await Place.findById(id).lean();

    return response.json(place);
}

export const getPlacesByPagination = async (req, res) => {

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
      { $project: { _id: 1, code: 1, placeName: 1, address: 1, }},
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNo - 1) * parseInt(pageSize) },
      { $limit: parseInt(pageSize) },
    ];

    const [data, totalRows] = await Promise.all([
      Place.aggregate(pipeline),
      Place.countDocuments(filter),
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
