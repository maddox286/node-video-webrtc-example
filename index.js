const { WebRTC } = require('./lib/WebRTC/index')

const { WebSocketServer } = require('./lib/WebSocket')

// peerConnection 配置
const configuration = {
    iceServers: [{
        urls: 'stun:127.0.0.1:3478'
    }]
}

new WebSocketServer(9000, (ws, data) => {
    const { type, payload, label: remoteDataChannelLabel } = JSON.parse(data)

    switch (type) {
        case 'connect':
            ws.webrtc = new WebRTC({
                configuration: configuration, socket: ws, rtcDataChannelList: [{
                    label: remoteDataChannelLabel, onMessage: () => {

                    }
                }], onDataChannelOpen: (channel) => {
                    if (ws.webrtcChannel) {
                        ws.webrtcChannel[channel.label] = channel
                    } else {
                        ws.webrtcChannel = {
                            [channel.label]: channel
                        }
                    }
                }, onDataChannelClose: (channel) => {
                    if (ws.webrtcChannel && ws.webrtcChannel[channel.label]) {
                        delete ws.webrtcChannel[channel.label]
                    }
                }, onClose: () => {
                }, sendCandidate: (candidate) => {
                    const msg = {
                        type: 'candidate',
                        payload: candidate,
                        name: 'terminal',
                        targetName: 'browser'
                    }
                    ws.send(JSON.stringify(msg))
                }, onSuccess() {
                    console.log('success')
                }

            })
            break
        case 'answer':
            ws.webrtc.onAnswer(payload)
            break
        case 'candidate':
            ws.webrtc.addCandidate(payload)
            break
        case 'close':
            ws.webrtc && ws.webrtc.close();
            break
    }
})
