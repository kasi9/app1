import Audio from '../models/audio.model.js';

export const createAudio = async (request, response) => {
    const audioNew = request.body;
    audioNew.audioName = request.body.name;
    audioNew.filePath = request.file.filename;
    audioNew.createdByUserId = request.user?.id;

//console.log('audio cret ', request.body, audioNew);
    await Audio.create(audioNew);
    return response.json({status: true, data: request.body, message: 'Audio created successfully.'})
}

export const updateAudio = async (request, response) => {

    const { id } = await request.params ;
    
    await Audio.findByIdAndUpdate(id, 
        { $set: { code: request.body.code, audioName: request.body.audioName, title: request.body.title, filePath: request.body.filePath, modifiedByUserId: request.user?.id } }, 
        {new: true});

    response.json({status: true, data: null, message: 'Audio updated successfully.'});
}

export const deleteAudio = async (request, response) => {
    const { id } = request.params;
    await Audio.findByIdAndDelete(id);
    response.json({status: true, data: null, message: 'Audio deleted successfully.'});
}

export const getAudios = async (request, response) => {
    const audios = await Audio.find( {} );
    return response.json(audios);
}

export const getAudio = async (request, response) => {
    const { id } = await request.params ;
    const audio = await Audio.findById(id).lean();

    return response.json(audio);
}

export const getAudiosByPagination = async (req, res) => {

  try {
    const { pageSize = 10, pageNo = 1, filterRules, sortrules, search } = req.params;

    let filterOr = {};
    if (search && search !== "_") {
      filterOr = {
        $or: [
          { code: { $regex: search, $options: "i" } },
          { audioName: { $regex: search, $options: "i" } },
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
      { $project: { _id: 1, code: 1, audioName: 1, titile: 1, filePath: 1}},
      ...(Object.keys(sortObj).length ? [{ $sort: sortObj }] : [{ $sort: { createdDate: -1 } }]),
      { $skip: (pageNo - 1) * parseInt(pageSize) },
      { $limit: parseInt(pageSize) },
    ];

    const [data, totalRows] = await Promise.all([
      Audio.aggregate(pipeline),
      Audio.countDocuments(filter),
    ]);
//console.log('get audio pagin', data);
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
