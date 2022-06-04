const path = require('path');
const fs = require('fs');
const multer = require('multer');
const musicMetadata = require('music-metadata');
const { createPartialContentHandler } = require("express-partial-content");
const { fileContentProvider } = require("./file-content-provider");


const mediaPath = path.resolve( __dirname, '..', 'out', 'medias');
const picturesPath = path.resolve( __dirname, '..', 'out', 'pictures');
const upload = multer({ dest: mediaPath });


const getAllMedias = async (req, res) => {

    try {
        const files = fs.readdirSync(mediaPath);
        const medias = [];

        for(const filename of files) {

            medias.push(await mapFilenameToMedia(filename));
        }

        res.send(medias);
    }
    catch(error) {
        res.status(500).send({ message: error.message });
    }
}

const getMedia = createPartialContentHandler(fileContentProvider, console)

const getMediaThumbnail = (req, res) => {

    const thumbnailPath = path.join(picturesPath, getThumbnailNameFromFilepPath(req.params.name));

    if (!fs.existsSync(thumbnailPath)) {
        res.status(404).send({ message: 'File not found' });
        return;
    }

    res.sendFile(thumbnailPath);
};

const uploadMedia = async (req, res, next) => {

    try {
        const medias = [];

        for(const file of req.files) {

            fs.renameSync(path.join(mediaPath, file.filename), path.join(mediaPath, file.originalname));

            medias.push(await mapFilenameToMedia(file.originalname));
        }

        res.send(medias);
    }
    catch(error) {
        res.status(500).send({ message: error.message });
    }
}

const registerRouters = (app) => {

    app.get('/media', getAllMedias);

    app.get('/media/:name', getMedia);

    app.get('/media/:name/thumbnail', getMediaThumbnail);

    app.post('/media/upload', upload.array('files', 5), uploadMedia);
}

const mapFilenameToMedia = async (filename) => {

    const metadata = await getMediaMetadata(path.join(mediaPath, filename));

    return {
        name: filename,
        type: filename.endsWith('.mp3') ? 'audio' : filename.includes('.mp4') ? 'video' : null,
        link: `media/${filename}`,
        duration: metadata.duration,
        artist: metadata.artist,
        title: metadata.title,
        thumbnailLink: `media/${filename}/thumbnail`,
    };
}

const getMediaMetadata = async (filePath) => {

    const meta = await musicMetadata.parseFile(filePath, { duration: true });
    let imageName = null;

    if (meta.common?.picture?.at(0)?.data) {

        imageName = getThumbnailNameFromFilepPath(path.basename(filePath));
        let imagePath = path.join(picturesPath, imageName);
        fs.writeFileSync(imagePath, meta.common.picture.at(0).data);
    }

    const metadata = {
        title: meta.common?.title ?? null,
        artist: meta.common?.artist ?? null,
        album: meta.common?.album ?? null,
        thumbnaiName: imageName ?? null,
        duration: meta.format?.duration ?? null,
    };

    return metadata;
}

const getThumbnailNameFromFilepPath = (filename) => {

    imageName = filename.replace(path.extname(filename), '');
    imageName = imageName + '.artwork.jpg';

    return imageName;
}


exports.registerRouters = registerRouters;