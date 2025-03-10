// Required modules
const FileManager = require("./FileManager");
var MTPpacket = require("./MTPResponse"),
singleton = require("./Singleton");

// Constants for data types
const DATA_TYPES = {
  version: "MTP version",
  timestamp: "Timestamp",
  reqType: "Request type",
  fileExtension: "Image file extension(s)",
  fileName: "Image file name"
}

// constants
const MTP_PROTOCOL_VERSION = 18;

/**
 * Handles the incoming data from the client, processes it, and sends a response.
 * @param {number} id - The unique client ID.
 * @param {Buffer} rawData - The raw data received from the client.
 * @param {Object} socket - The socket object for communication.
 */
function onData(id, rawData, socket) {
  // Print binary data in packet
  printPacketBit(rawData); 

  // Print parsed request details
  console.log(`\nClient-${id} requests:`);
  let data = parseRequestPacket(rawData);
  console.log(formatData(data));

  // if the wrong version - reject.
  if (data["MTP version"] != MTP_PROTOCOL_VERSION) {
    // ignore
    console.log("Invalid version request! Ignoring...");
    return;
  }

  // if a query, perform the query
  if (data["Request type"] == "QUERY") {
    doQuery(data, socket, id);
  } else {
    // ignore
    console.log("Invalid Request type, ignoring...");
    socket.end();
    return;
  }
}

async function doQuery(data, socket, id) {
  // Retrieve the file data based on the parsed request
  let imgData = await FileManager.getFileData(FileManager.getFilePath(
    data[DATA_TYPES.fileName] + "." + data[DATA_TYPES.fileExtension]
  ));

  // If file not found, send "not found" response
  if (imgData == -1) { 
    MTPpacket.init(
      MTPpacket.ResponseTypes.NOT_FOUND, 
      true, 
      0, 
      0
    );
    const packet = MTPpacket.getBytePacket();
    socket.write(packet)
    return;
  }
    
  // If file is found, send the file data in packets
  process.stdout.write(`Sending packets to Client-${id}...`)
  
  const CHUNK_SIZE = 900; // Define the size of each packet
  let sequenceNumber = 0;
  for (let i = 0; i < imgData.length; i += CHUNK_SIZE) {
    const chunk = imgData.slice(i, i + CHUNK_SIZE);
    const isLast = (i + CHUNK_SIZE) >= imgData.length ? 1 : 0;
    
    MTPpacket.init(
      MTPpacket.ResponseTypes.FOUND,
      isLast,
      chunk.length,
      chunk,
      sequenceNumber++
    );
    const packet = MTPpacket.getBytePacket();
    socket.write(packet);  // Send the packet
    await new Promise(resolve => setTimeout(resolve, 10)); // Add a small delay
  }
  console.log(`Done!`)
}

module.exports = {
  /**
   * Handles a client connection and reads data from the client socket.
   * Logs connection details and processes data on 'data' event.
   * @param {Object} sock - The socket object for the client connection.
   */
  handleClientJoining: function (sock) {
    // Log client connection
    console.log(`Client joined: ${sock.remoteAddress}\n`);

    // Log client connection with timestamp
    const id = singleton.getTimestamp();
    console.log(`Client-${id} is connected at timestamp: ${id}`);

    // Read data from client socket
    sock.on("data", (rawData) => { 
      console.log('MTP packet received:');
      try {

        onData(id, rawData, sock);  // Process incoming data
      } catch (e) {
        console.warn(
          `Packet was invalid, could not read. \nReceived: ${rawData}.`
        )
      }
    });
  }
};

/**
 * Converts a byte array to a string.
 * @param {Array} array - The byte array to convert.
 * @returns {string} The resulting string.
 */
function bytesToString(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

/**
 * Converts a byte array to a number.
 * @param {Array} array - The byte array to convert.
 * @returns {number} The resulting number.
 */
function bytes2number(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result ^= array[array.length - i - 1] << (8 * i);
  }
  return result;
}

/**
 * Returns an integer value of a subset of bits from the packet.
 * @param {Buffer} packet - The packet to parse.
 * @param {number} offset - The starting bit position.
 * @param {number} length - The number of bits to extract.
 * @returns {number} The extracted integer value.
 */
function parseBitPacket(packet, offset, length) {
  let number = "";
  for (var i = 0; i < length; i++) {
    // Get the actual byte position of the offset
    let bytePosition = Math.floor((offset + i) / 8);
    let bitPosition = 7 - ((offset + i) % 8);
    let bit = (packet[bytePosition] >> bitPosition) % 2;
    number = (number << 1) | bit;
  }
  return number;
}

/**
 * Prints the entire packet in a bit format (binary).
 * @param {Buffer} packet - The packet to print.
 */
function printPacketBit(packet) {
  var bitString = "";

  for (var i = 0; i < packet.length; i++) {
    // Add leading zeros to the binary representation
    var b = "00000000" + packet[i].toString(2);
    // Print 4 bytes per line for better readability
    if (i > 0 && i % 4 == 0) bitString += "\n";
    bitString += " " + b.substr(b.length - 8);
  }
  console.log(bitString);
}

/**
 * Parses the raw data packet and extracts relevant request information.
 * @param {Buffer} packet - The packet to parse.
 * @returns {Object} The parsed request data.
 * @throws Will throw an error if parsing fails.
 */
function parseRequestPacket(packet) {
  try {
    const version = parseBitPacket(packet, 0, 5);
    const timestamp = parseBitPacket(packet, 32, 32);
    const reqType = formatReqResType(parseBitPacket(packet, 30, 2));
    const fileExtension = formatExtension(parseBitPacket(packet, 64, 4));
    const fileNameLength = parseBitPacket(packet, 68, 28);
    const fileName = bytesToString(packet.slice(12, 12 + fileNameLength));
    
    let data = {
      "MTP version": version,
      "Timestamp": timestamp,
      "Request type": reqType,
      "Image file extension(s)": fileExtension,
      "Image file name": fileName
    };
    
    return data
  } catch (e) {
    throw new errors.ResponseParseError(`Could not parse response.\n${e}`);
  }
}

/**
 * Formats the parsed data as a string for display.
 * @param {Object} data - The parsed data to format.
 * @returns {string} The formatted string.
 */
function formatData(data) {
  let out = "";
  for (const [key, value] of Object.entries(data)) {
    out += `\t${key} = ${value}\n`;
  }
  return out;
}

/**
 * Formats the request/response type as a string based on the number.
 * @param {number} num - The request/response type number.
 * @returns {string} The formatted string representation of the type.
 */
function formatReqResType(num) {
  const ReqResTypes = {...MTPpacket.RequestTypes, ...MTPpacket.ResponseTypes};
  return Object.keys(ReqResTypes).find(key => ReqResTypes[key] === num) || `UNKNOWN ${num}`;
}

/**
 * Formats the file extension based on the number.
 * @param {number} num - The file extension number.
 * @returns {string} The formatted string representation of the extension.
 */
function formatExtension(num) {
  return Object.keys(MTPpacket.MediaTypes).find(key => MTPpacket.MediaTypes[key] === num) || `UNKNOWN ${num}`;
}
