const fs = require("fs");
const path = require("path");
const { ContentDoesNotExistError } = require('express-partial-content');

exports.fileContentProvider = async (req, res) => {

    // Read file name from route params.
    const fileName = req.params.name;
    const file = path.resolve(__dirname, '..', 'medias', fileName);
    console.log(`filename: ${file}`);

    if (!fs.existsSync(file)) {
        throw new ContentDoesNotExistError(`File doesn't exist: ${file}`);
    }

    const stats = fs.statSync(file);
    const totalSize = stats.size;
    const mimeType = "application/octet-stream";

    const getStream = (range) => {
        if (!range) {
            // Request if for complete content.
            return fs.createReadStream(file);
        }
        // Partial content request.
        const { start, end } = range;
        console.log(`${file} start: ${start}, end: ${end}`);
        return fs.createReadStream(file, { start, end });
    };

    return {
        fileName,
        totalSize,
        mimeType,
        getStream
    };
}