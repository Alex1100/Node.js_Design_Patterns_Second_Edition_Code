"use strict";

const child_process = require('child_process');
const net = require('net');
const path = require('path');

function multiplexChannels(sources, destination) {
  let totalChannels = sources.length;
  for(let i = 0; i < sources.length; i++) {
    sources[i]
      .on('readable', i => {    //[1]
        let chunk;
        while((chunk = this.read()) !== null) {
          let outBuff = new Buffer(1 + 4 + chunk.length);  //[2]
          outBuff.writeUInt8(i, 0);
          outBuff.writeUInt32BE(chunk.length, 1);
          chunk.copy(outBuff, 5);
          console.log('Sending packet to channel: ' + i);
          destination.write(outBuff);          //[3]
        }
      }
      .on('end', () => {    //[4]
      if(--totalChannels === 0) {
          destination.end();
      }
    });
  }
}

let socket = net.connect(3000, () => {        //[1]
  let child = child_process.fork(           //[2]
    process.argv[2],
    process.argv.slice(3),
    {silent: true}
  );
  
  multiplexChannels([child.stdout, child.stderr], socket);  //[3]
});
