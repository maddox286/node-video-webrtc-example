/**
 * WebSocket 的 Server 模块
 * 自定义了 构造函数
 * 通过实例化该构造函数来
 */
const { WebSocketServer: OriginWebSocketServer } = require('ws')

class WebSocketServer {

    _wss

    constructor(serverPort, onMessage) {
        this._wss = new OriginWebSocketServer({
            port: serverPort,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    // See zlib defaults.
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                // Other options settable:
                clientNoContextTakeover: true, // Defaults to negotiated value.
                serverNoContextTakeover: true, // Defaults to negotiated value.
                serverMaxWindowBits: 10, // Defaults to negotiated value.
                // Below options specified as default values.
                concurrencyLimit: 10, // Limits zlib concurrency for perf.
                threshold: 1024 // Size (in bytes) below which messages
                // should not be compressed if context takeover is disabled.
            }
        })

        this._wss.on('connection', function connection(ws) {
            console.log('wsc 已连接')
            ws.onmessage = function(event) {
                onMessage(ws, event.data)
            }
        })
    }

}



module.exports = {
    WebSocketServer
}
