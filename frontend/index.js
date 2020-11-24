import './style.css'
import * as WebSocket from 'isomorphic-ws'



let ws
let rows, cols
const connect = () => {
    ws = new WebSocket('ws://localhost:8999');
    ws.binaryType = "arraybuffer";

    ws.onopen = function open() {
        console.log('connected');
    };
    ws.onclose = function close() {
        console.log('disconnected');
        connect()
    };

    let firstMessage = true
    ws.onmessage = function incoming(e) {
        const data = e.data
        if ( firstMessage ) {
            handleInit(JSON.parse( data ))
            firstMessage = false
        } else {
            handleData( data )
        }
    };
}
connect()

const handleInit = (conf) => {
    try {
        console.log(`init`, conf)
        rows = conf.rows
        cols = conf.cols
    } catch ( e ) {
        console.error(`init error: ${e.message}`)
    }
}

const handleData = ( data ) => {
    try {
        if ( ! rows || ! cols ) throw new Error(`dimensions not initialized`)

        const imgData = new ImageData(
            new Uint8ClampedArray(data),
            cols,
            rows
        )

        const canvas = document.getElementById('canvas')
        canvas.height = rows;
        canvas.width = cols;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imgData, 0, 0);

    } catch ( e ) {
        console.error(e.message)
    }
}
