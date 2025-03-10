const fs = require('fs').promises

const IMAGES_DIR = "images";

module.exports = {
    getFilePath(fileName) {
        return IMAGES_DIR + "/" + fileName;
    },

    async getFileData(filePath) {
        try {
            // Read the file asynchronously as a Buffer (binary data)
            const data = await fs.readFile(filePath);
            return data;
        } catch (err) {
            console.error("Could not read file: " + err);
            return -1;
        }
    }
}