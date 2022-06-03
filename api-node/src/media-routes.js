const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createPartialContentHandler } = require("express-partial-content");
const { fileContentProvider } = require("./file-content-provider");


const mediaPath = path.resolve( __dirname, '..', 'medias');
const upload = multer({ dest: mediaPath });


const getAllMedias = (req, res) => {

    try {
        const files = fs.readdirSync(mediaPath);
        const medias = files.map(mapFilenameToMedia);

        res.send(medias);
    }
    catch(error) {
        res.status(500).send({ message: error.message });
    }
}

const getMedia = createPartialContentHandler(fileContentProvider, console)

const uploadMedia = (req, res, next) => {

    try {
        const medias = req.files.map(file => {

            fs.renameSync(path.join(mediaPath, file.filename), path.join(mediaPath, file.originalname));

            return mapFilenameToMedia(file.originalname);
        });

        res.send(medias);
    }
    catch(error) {
        res.status(500).send({ message: error.message });
    }
}



const registerRouters = (app) => {

    app.get('/media', getAllMedias);

    app.get('/media/:name', getMedia);

    app.post('/media/upload', upload.array('files', 5), uploadMedia);
}

const mapFilenameToMedia = (filename) => {

    return {
        name: filename,
        type: filename.endsWith('.mp3') ? 'audio' : filename.includes('.mp4') ? 'video' : null,
        link: `media/${filename}`
    };
}



exports.registerRouters = registerRouters;