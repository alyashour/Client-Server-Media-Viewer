let singleton = require("./Singleton.js");

// DEFAULTS
HEADER_SIZE = 12 // bytes
MTP_VERSION = 0b10010 // 18

// ERRORS
class ResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

// REQUEST & RESPONSE TYPES
let RequestTypes = Object.freeze({
  QUERY: 0
});
let ResponseTypes = Object.freeze({
  FOUND: 1,
  NOT_FOUND: 2,
  BUSY: 3,
});

// MEDIA TYPE
let MediaTypes = Object.freeze({
  JPEG: 0,
  BMP: 1,
  TIFF: 2,
  PNG: 3,
  GIF: 4,
  RAW: 5,
  MP4: 6,
  AVI: 7, 
  MOV: 8,
});

/**
 * Checks if the response type is valid.
 * @param {number} response - The response type to check.
 * @returns {boolean} - True if the response type is valid, false otherwise.
 */
function isValidResponse(response) {
  return Object.values(ResponseTypes).includes(response);
}

// internal methods

/**
 * Creates the header for the response packet.
 * @param {number} responseType - The type of the response.
 * @param {boolean} isLast - Indicates if this is the last packet.
 * @param {number} payloadSize - The size of the payload.
 * @returns {Buffer} - The response header.
 * @throws {ResponseError} - If the response type is invalid.
 */
function createHeader(responseType, isLast, payloadSize) {
  // create the packet
  let responseHeader = new Buffer.alloc(HEADER_SIZE);

  // version
  storeBitPacket(responseHeader, MTP_VERSION, 0, 5); // set the version to 18, 5 bits

  // response type
  if (isValidResponse(responseType))
    storeBitPacket(responseHeader, responseType, 5, 3);
  else throw new ResponseError(`Cannot form response, invalid response type ${responseType}.`);

  // sequence number
  storeBitPacket(responseHeader, singleton.getSequenceNumber(), 8, 24);

  // timestamp
  storeBitPacket(responseHeader, singleton.getTimestamp(), 32, 32);

  // L?
  storeBitPacket(responseHeader, isLast, 64, 1);

  // payload size
  storeBitPacket(responseHeader, payloadSize, 65, 31);

  return responseHeader;
}

module.exports = {
  RequestTypes,
  ResponseTypes,
  MediaTypes,
  /**
   * Initializes the response packet.
   * @param {number} responseType - The type of the response.
   * @param {boolean} isLast - Indicates if this is the last packet.
   * @param {number} payloadSize - The size of the payload.
   * @param {Buffer} payload - The payload data.
   */
  init: function (
    responseType,
    isLast,
    payloadSize,
    payload
  ){
    this.responseHeader = createHeader(responseType, isLast, payloadSize);
    this.payload = payload;
    this.payloadSize = payloadSize;
  },
  //--------------------------
  //getBytePacket: returns the entire packet in bytes
  //--------------------------
  /**
   * Returns the entire packet in bytes.
   * @returns {Buffer} - The complete packet.
   */
  getBytePacket: function () {
    let packet = new Buffer.alloc(this.payloadSize + HEADER_SIZE);
    //construct the packet = header + payload
    for (var Hi = 0; Hi < HEADER_SIZE; Hi++)
      packet[Hi] = this.responseHeader[Hi];
    for (var Pi = 0; Pi < this.payloadSize; Pi++)
      packet[Pi + HEADER_SIZE] = this.payload[Pi];

    return packet;
  },
};

/**
 * Stores an integer value into the packet bit stream.
 * @param {Buffer} packet - The packet to store the value in.
 * @param {number} value - The value to store.
 * @param {number} offset - The bit offset to start storing the value.
 * @param {number} length - The number of bits to store the value in.
 */
function storeBitPacket(packet, value, offset, length) {
  // let us get the actual byte position of the offset
  let lastBitPosition = offset + length - 1;
  let number = value.toString(2);
  let j = number.length - 1;
  for (var i = 0; i < number.length; i++) {
    let bytePosition = Math.floor(lastBitPosition / 8);
    let bitPosition = 7 - (lastBitPosition % 8);
    if (number.charAt(j--) == "0") {
      packet[bytePosition] &= ~(1 << bitPosition);
    } else {
      packet[bytePosition] |= 1 << bitPosition;
    }
    lastBitPosition--;
  }
}

/**
 * Prints the entire packet in bits format.
 * @param {Buffer} packet - The packet to print.
 */
function printPacketBit(packet) {
  var bitString = "";

  for (var i = 0; i < packet.length; i++) {
    // To add leading zeros
    var b = "00000000" + packet[i].toString(2);
    // To print 4 bytes per line
    if (i > 0 && i % 4 == 0) bitString += "\n";
    bitString += " " + b.substr(b.length - 8);
  }
  console.log(bitString);
}