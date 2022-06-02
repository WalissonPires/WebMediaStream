const express = require("express");
const cors = require('cors');
const { createPartialContentHandler } = require("express-partial-content");
const { fileContentProvider } = require("./file-content-provider");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const mediaPath = path.resolve( __dirname, '..', 'medias');

const app = express();
app.use(cors());

app.get('/media/:name', createPartialContentHandler(fileContentProvider, console));

const upload = multer({ dest: mediaPath });
app.post('/media/upload', upload.array('files', 5), (req, res, next) => {

    const medias = req.files.map(file => {

        fs.renameSync(path.join(mediaPath, file.filename), path.join(mediaPath, file.originalname));

        return mapFilenameToMedia(file.originalname);
    });

    res.send(medias);
});

app.get('/media', (req, res) => {

    const files = fs.readdirSync(mediaPath);
    const medias = files.map(mapFilenameToMedia);

    res.send(medias);
});

function mapFilenameToMedia(filename) {

    return {
        name: filename,
        type: filename.endsWith('.mp3') ? 'audio' : filename.includes('.mp4') ? 'video' : null,
        link: `media/${filename}`
    };
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));