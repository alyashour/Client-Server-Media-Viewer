let singleton = require('./Singleton');

const HEADER_SIZE = 12;

// REQUEST & RESPONSE TYPES
let RequestTypes = Object.freeze({
  QUERY: 0
})
let ResponseTypes = Object.freeze({
  FOUND: 1,
  NOT_FOUND: 2,
  BUSY: 3,
})

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
 * Get the media type based on the file extension.
 * @param {string} fileName - The name of the file.
 * @returns {number} - The media type or -1 if not supported.
 */
function getMediaType(fileName) {
  if (typeof fileName !== "string") return -1;
  
  let ext = fileName.split(".").pop().toUpperCase();
  
  return MediaTypes.hasOwnProperty(ext) ? MediaTypes[ext] : -1;
}

module.exports = {
  ResponseTypes,
  RequestTypes,
  MediaTypes,
  // You may need to add some statements here
  /**
   * Initialize the request header and payload.
   * @param {number} version - The version of the request.
   * @param {string} fileName - The name of the media file.
   */
  init: function (
    version,
    fileName
  ) {
    // header
    this.requestHeader = new Buffer.alloc(12);

    // store version
    storeBitPacket(this.requestHeader, version, 0, 5);

    // skip 28 bits for reserved section

    // request type
    storeBitPacket(this.requestHeader, RequestTypes.QUERY, 30, 2);

    // timestamp
    storeBitPacket(this.requestHeader, singleton.getTimestamp(), 32, 32);

    // media type
    const mediaType = getMediaType(fileName);
    if (mediaType == -1)
      throw new Error("Filetype not supported.");

    storeBitPacket(this.requestHeader, mediaType, 64, 4);

    // media file name size (in bytes)
    const fileNameBytes = stringToBytes(fileName.split('.')[0]);
    storeBitPacket(this.requestHeader, fileNameBytes.length, 68, 28);
    
    // payload
    this.payload = new Buffer.alloc(fileNameBytes.length);
    this.payload.set(fileNameBytes);
  },

  //--------------------------
  //getBytePacket: returns the entire packet in bytes
  //--------------------------
  getBytePacket: function () {
    let packet = new Buffer.alloc(this.payload.length + HEADER_SIZE);
    //construct the packet = header + payload
    for (var Hi = 0; Hi < HEADER_SIZE; Hi++) packet[Hi] = this.requestHeader[Hi];
    for (var Pi = 0; Pi < this.payload.length; Pi++)
      packet[Pi + HEADER_SIZE] = this.payload[Pi];

    return packet;
  },
};

/**
 * Convert a string to an array of bytes.
 * @param {string} str - The string to convert.
 * @returns {Array} - The array of bytes.
 */
function stringToBytes(str) {
  var ch,
    st,
    re = [];
  for (var i = 0; i < str.length; i++) {
    ch = str.charCodeAt(i); // get char
    st = []; // set up "stack"
    do {
      st.push(ch & 0xff); // push byte to stack
      ch = ch >> 8; // shift value down by 1 byte
    } while (ch);
    // add stack contents to result
    // done because chars have "wrong" endianness
    re = re.concat(st.reverse());
  }
  // return an array of bytes
  return re;
}

/**
 * Store an integer value into the packet bit stream.
 * @param {Buffer} packet - The packet buffer.
 * @param {number} value - The value to store.
 * @param {number} offset - The bit offset.
 * @param {number} length - The number of bits.
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
