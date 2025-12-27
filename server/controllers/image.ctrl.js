import Image from '../models/image.model.js';

export const createImage = async (request, response) => {
  console.log('image creatfadfd ', request.body, request.file);
    const imageNew = request.body;
    imageNew.imageName = request.body.name;
    imageNew.filePath = request.file.filename;
//    imageNew.createdByUserId = request.user?.id;


    await Image.create(imageNew);
    return response.json({status: true, data: request.body, message: 'Image created successfully.'})
}

export const updateImage = async (request, response) => {

    const { id } = await request.params ;
    
    await Image.findByIdAndUpdate(id, 
        { $set: { code: request.body.code, imageName: request.body.imageName, title: request.body.title, filePath: request.body.filePath, modifiedByUserId: request.user?.id } }, 
        {new: true});

    response.json({status: true, data: null, message: 'Image updated successfully.'});
}

export const deleteImage = async (request, response) => {
    const { id } = request.params;
    await Image.findByIdAndDelete(id);
    response.json({status: true, data: null, message: 'Image deleted successfully.'});
}

export const getImages = async (request, response) => {
    const images = await Image.find( {} );
    return response.json(images);
}

export const getImage = async (request, response) => {
    const { id } = await request.params ;
    const image = await Image.findById(id).lean();

    return response.json(image);
}

export const getImagesByPagination = async (req, res) => {

  try {
    const { pageSize = 10, pageNo = 1, filterRules, sortrules, search } = req.params;

    let filterOr = {};
    if (search && search !== "_") {
      filterOr = {
        $or: [
          { code: { $regex: search, $options: "i" } },
          { imageName: { $regex: search, $options: "i" } },
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
      { $project: { _id: 1, code: 1, imageName: 1, titile: 1, filePath: 1}},
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNo - 1) * parseInt(pageSize) },
      { $limit: parseInt(pageSize) },
    ];

    const [data, totalRows] = await Promise.all([
      Image.aggregate(pipeline),
      Image.countDocuments(filter),
    ]);
console.log('get audio pagin', data);
    res.json({
      result: data,
      totalRows,
      totalPages: Math.ceil(totalRows / pageSize),
    });
  } catch (error) {
    console.error("Error in :", error);
    res.status(500).json({ error: error.message });
  }
};
