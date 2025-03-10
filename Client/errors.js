/**
 * Custom error class for handling response parsing errors.
 */
class ResponseParseError extends Error {
    /**
     * Constructs a new ResponseParseError instance.
     * @param {string} message - The error message.
     */
    constructor(message) {
        super(message); // Call the parent class constructor
        this.name = this.constructor.name; // Set the error name to the class name
    }
}

module.exports = {
    ResponseParseError // Export the custom error class
}