/**
 * WebSocket 的 Client 模块
 * 自定义了 send方法 及 构造函数
 */
const { WebSocket: OriginalWebSocket } = require('ws')

class WebSocket {
    // 默认配置
    _defOptions = {
        perMessageDeflate: false
    }

    _ws

    constructor({url, options, onOpen, onMessage, onClose}) {
        this._ws = new OriginalWebSocket(url, options === null ? this._defOptions : options)
        this._ws.on('open', onOpen)
        this._ws.on('message', onMessage)
        this._ws.on('close', onClose)
    }

    sendMessage({type, payload, name, targetName, label}) {
        this._ws.send(JSON.stringify({type, payload, name, targetName, label}))
    }
}

module.exports = {
    WebSocket
}

