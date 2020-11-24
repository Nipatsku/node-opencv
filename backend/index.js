const cv = require('opencv4nodejs')
const express = require('express')
const WebSocket = require('ws')
const http = require('http');



const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ server });


let cols, rows, curFrame
const handleFrame = async ( frame ) => {
    curFrame = frame
    const doInit = cols === undefined
    cols = frame.cols
    rows = frame.rows

    if ( !socket ) return
    if ( doInit ) {
        console.log(`send init`)
        socket.send(JSON.stringify( { cols, rows } ))
    }

    // convert image to rgba color space
    const matRGBA = frame.channels === 1
        ? frame.cvtColor(cv.COLOR_GRAY2RGBA)
        : frame.cvtColor(cv.COLOR_BGR2RGBA);

    const data = matRGBA.getData() // Buffer
    socket.send( data )
}

let socket
ws.on('connection', (ws) => {
    console.log('new websocket connection')
    socket = ws
    cols = rows = undefined 
});
ws.on('close', (ws) => {
    console.log('websocket disconnected')
    socket = undefined
})

//start our server
server.listen(process.env.PORT || 8999, async () => {
    console.log(`Server started on port ${server.address().port} :)`);

    // open capture from webcam
    const devicePort = 0;
    const vCap = new cv.VideoCapture(devicePort);

    // loop through the capture
    const delay = 50;
    let done = false;
    let iFrame = 0
    let start = Date.now()
    while (!done) {
        let frame = vCap.read();

        // loop back to start on end of stream reached
        if (frame.empty) {
            vCap.reset();
            frame = vCap.read();
        }

        const fps = 1000 / ( (Date.now() - start) / (iFrame+1) )



        // * apply image processing on server side *

        cv.drawTextBox( frame, { x: 0, y: 0 }, [{
            text: "Candy camera"
        }], 1)

        if ( cols && rows ) {
            cv.drawTextBox( frame, { x: cols - 125, y: 0 }, [{
                text: `fps ${fps.toFixed( 1 )}`
            }], 1)
        }



        await handleFrame( frame )
        await new Promise(resolve => setTimeout(resolve, delay))
        iFrame ++
    }

});
