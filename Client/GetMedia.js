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

// Enter your code for the client functionality here
// You should connect to the server and send the request packet
// You should receive the response packet from the server
// You should print the response packet in bits format
// You should extract the media data from the response packet
// You should save the image data to a file

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
});

// if data is received
client.on('data', (rawData) => {
  console.log('MTP packet header received:')

  // print the packet
  printPacketBit(rawData);

  // parse the packet
  let data = parsePacket(rawData);
  
  console.log('Server sent:');
  console.log(formatData(data));
})

// finally, connect the client and send the request packet.
client.connect({ port, host: serverIP }, () => {
  console.log(`Connected to MediaDB server on: ${serverIP}:${port}\n`);

  MTPpacket.init(version, imageName);
  client.write(MTPpacket.getBytePacket());
})

//some helper functions
// return integer value of the extracted bits fragment
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

function bytes2string(array) {
  var result = "";
  for (var i = 0; i < array.length; ++i) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}

function parsePacket(packet) {
  try {
    let data = {
      "MTP version": parseBitPacket(packet, 0, 5),
      "Response Type": formatReqResType(parseBitPacket(packet, 5, 3)),
      "Sequence Number": parseBitPacket(packet, 8, 24),
      "Timestamp": parseBitPacket(packet, 32, 32)
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
  return Object.keys(ReqResTypes).find(key => ReqResTypes[key] === num) || "UNKNOWN";
}