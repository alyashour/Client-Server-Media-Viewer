var MTPpacket = require("./MTPResponse"),
singleton = require("./Singleton");

// You need to add some statements here
function createResponse() {
  MTPpacket.init(MTPpacket.ResponseTypes.NOT_FOUND, true, 0, 0);
  return MTPpacket.getBytePacket();
}

module.exports = {
  handleClientJoining: function (sock) {
    // log
    console.log(`Client joined: ${sock.remoteAddress}\n`);

    // log joining
    const id = singleton.getTimestamp();
    console.log(`Client-${id} is connected at timestamp: ${id}`);

    // read data from client socket
    sock.on("data", (rawData) => { 
      console.log('MTP packet received:');
      try {
        // print binary data
        printPacketBit(rawData); 

        // print requests
        console.log(`Client-${id} requests:`);
        let data = parseRequestPacket(rawData);
        console.log(formatData(data));
      } catch (e) {
        console.warn(
          `Packet was invalid, could not read. \n
          Received: ${rawData}.`)
      }
    });

    sock.write(createResponse())

    sock.end();
  }
};

function handleClientLeaving(sock) {
        // Enter your code here
        //
        // you may need to develop some helper functions
        // that are defined outside this export block
  
}


function bytesToString(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

function bytes2number(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result ^= array[array.length - i - 1] << (8 * i);
  }
  return result;
}

// return integer value of a subset bits
function parseBitPacket(packet, offset, length) {
  let number = "";
  for (var i = 0; i < length; i++) {
    // let us get the actual byte position of the offset
    let bytePosition = Math.floor((offset + i) / 8);
    let bitPosition = 7 - ((offset + i) % 8);
    let bit = (packet[bytePosition] >> bitPosition) % 2;
    number = (number << 1) | bit;
  }
  return number;
}
// Prints the entire packet in bits format
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

function parseRequestPacket(packet) {
  try {
    const version = parseBitPacket(packet, 0, 5);
    const timestamp = parseBitPacket(packet, 32, 32);
    const reqType = formatReqResType(parseBitPacket(packet, 30, 2));
    const fileExtension = parseBitPacket(packet, 64, 4);
    const fileNameLength = parseBitPacket(packet, 68, 28);
    const fileName = parseBitPacket(packet, 96, fileNameLength)
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

function formatData(data) {
  let out = "";
  for (const [key, value] of Object.entries(data)) {
    out += `\t${key} = ${value}\n`;
  }
  return out;
}

function formatReqResType(num) {
  const ReqResTypes = {...MTPpacket.RequestTypes, ...MTPpacket.ResponseTypes};
  return Object.keys(ReqResTypes).find(key => ReqResTypes[key] === num) || `UNKNOWN ${num}`;
}
