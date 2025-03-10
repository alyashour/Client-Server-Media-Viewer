const fs = require('fs').promises

const IMAGES_DIR = "images";

module.exports = {
    /**
     * Get the file path for a given file name.
     * @param {string} fileName - The name of the file.
     * @returns {string} The file path.
     */
    getFilePath(fileName) {
        return IMAGES_DIR + "/" + fileName;
    },

    /**
     * Asynchronously get the data of a file.
     * @param {string} filePath - The path of the file.
     * @returns {Promise<Buffer|number>} The file data as a Buffer, or -1 if an error occurs.
     */
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