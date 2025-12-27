import YouTubeVideo from "../models/youtube.model.js"

export const saveYouTubeVideo = async (req, res) => {
    const video = new YouTubeVideo(req.body);
    await video.save();    

    res.json({status: true, data: video, message: 'Video created successfully.'});
}

export const updateYouTubeVideo = async (request, response) => {

    const { id } = await request.params ;
    
    await YouTubeVideo.findByIdAndUpdate(id, 
        { $set: { title: request.body.title, description: request.body.description, modifiedByUserId: request.user?.id } }, 
        {new: true});

    response.json({status: true, data: null, message: 'YouTube Video updated successfully.'});
}

export const deleteYouTubeVideo = async (req, res) => {
 
    const { id } = await req.params;
    await YouTubeVideo.findByIdAndDelete(id);

    res.json({status: true, data: null, message: 'Person deleted successfully.'});
}

export const getYouTubeVideos = async (req, res) => {
    const list = await YouTubeVideo.find({});

    res.json(list);
}

export const getYouTubeVideo = async (req, res) => {
        const { id } = await req.params;
    const video = await YouTubeVideo.findById(id);

    res.json({status: true, data: video, message: 'Video fetched successfully.'});
}
