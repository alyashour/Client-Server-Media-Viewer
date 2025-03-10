let net = require("net");
let fs = require("fs");
let open = require("open");

const args = require('minimist')(process.argv.slice(2));

let MTPpacket = require("./MTPRequest");
let singleton = require("./Singleton");
let errors = require("./errors");

singleton.init();

// call as GetImage -s <serverIP>:<port> -q <image name> -v <version>

// make sure all args are provided
if (!(args.s || args.q || args.v))
  throw new Error("Cannot get media, not enough options provided.");

// make sure server:port is the right format
const split = args.s.split(':')
if (split.length != 2)
  throw new Error("-p option must have format <server ip>:<port>.")

// pull values
const serverIP = split[0];
const port = split[1];
const imageName = args.q;
const version = args.v;

// create client
const client = new net.Socket();

// if an error occurs
client.on('error', (e) => {
  console.error(e);
})

// if the client closes
client.on('end', () => {
  console.log("Disconnected from the server.");
})

client.on('close', () => {
  console.log('Connection closed.');
  process.exit();
});

// if data is received
client.on('data', (data) => {
  console.log('MTP packet header received:')

  // print the packet
  let headerData = data.slice(0, 12);
  printPacketBit(headerData);

  // parse the packet
  headerInfo = parsePacket(headerData);
  
  console.log('Server sent:');
  console.log(formatData(headerInfo));

  if (headerInfo.resType === "FOUND") {
    saveImage(imageName, data.slice(12, data.length));
    openImage(imageName);
  } else if (headerInfo.resType === "NOT_FOUND") {
    console.log("Image not found, exiting...");
  } else if (headerInfo.resType === "BUSY") {
    console.log("Server busy, please try again later. Exiting...");
  } else {
    console.log("Could not perform action...");
  }

  process.exit();
})

// finally, connect the client and send the request packet.
client.connect({ port, host: serverIP }, () => {
  console.log(`Connected to MediaDB server on: ${serverIP}:${port}\n`);

  console.log("Sending request...");
  MTPpacket.init(version, imageName);
  client.write(MTPpacket.getBytePacket());
})

// Helper function to return integer value of the extracted bits fragment
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

// Helper function to print the entire packet in bits format
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

// Helper function to convert bytes array to string
function bytes2string(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

// Helper function to parse the packet
function parsePacket(packet) {
  try {
    let data = {
      "version": parseBitPacket(packet, 0, 5),
      "resType": formatReqResType(parseBitPacket(packet, 5, 3)),
      "sequenceNumber": parseBitPacket(packet, 8, 24),
      "timestamp": parseBitPacket(packet, 32, 32),
      "l": parseBitPacket(packet, 64, 1),
      "payloadSize": parseBitPacket(packet, 65, 31),
    };
    return data
  } catch (e) {
    throw new errors.ResponseParseError(`Could not parse response.\n${e}`);
  }
}

// Helper function to format the parsed data
function formatData(data) {
  return `
  \tMTP version = ${data.version}
  \tResponse Type = ${data.resType}
  \tSequence Number = ${data.sequenceNumber}
  \tTimestamp = ${data.timestamp}
  \tIs last? = ${data.l}
  `;
}

// Helper function to format request/response type
function formatReqResType(num) {
  const ReqResTypes = {...MTPpacket.RequestTypes, ...MTPpacket.ResponseTypes};
  return Object.keys(ReqResTypes).find(key => ReqResTypes[key] === num) || "UNKNOWN";
}

// Helper function to save the image data to a file
function saveImage(imagePath, data) {
  console.log("\nSaving image...")
  fs.writeFileSync(imagePath, data);
  console.log(`Image saved as ${imagePath}`);
}

// Helper function to open the saved image
function openImage(imagePath) {
  console.log("\nOpening image...");
  open(imagePath).then(() => {
    console.log("Opened " + imagePath + "!")
  })
  .catch((e) => {
    console.error("Could not open image...\n" + e)
  })
}