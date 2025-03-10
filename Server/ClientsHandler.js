var MTPpacket = require("./MTPResponse"),
singleton = require("./Singleton");

// You need to add some statements here
function createResponse() {
  MTPpacket.init(MTPpacket.ResponseTypes.NOT_FOUND, true, 0, 0);
  return MTPpacket.getBytePacket();
}

module.exports = {
  handleClientJoining: function (sock) {
    //
    // Enter your code here
    //
    // you may need to develop some helper functions
    // that are defined outside this export block
    sock.on("data", (data) => { 
      if (data)
        try {
          printPacketBit(data); 
        } catch (e) {
          console.warn(
            `Packet was invalid, could not read. \n
            Received: ${data}.`)
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
