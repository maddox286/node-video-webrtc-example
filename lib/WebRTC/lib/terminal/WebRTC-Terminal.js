const {
    MediaStream, RTCPeerConnection, RTCSessionDescription
} = require('wrtc')
const { RTCVideoSource } = require('./RTCVideoSource')

class WebRTC {

    _configuration

    _socket

    _pc

    _onDataChannelOpen

    _onDataChannelClose

    _onClose

    _sendCandidate

    _mediaStream

    _rtcVideoSource

    videoSink

    _receiveVideoTrack
    connected

    constructor({
                    configuration,
                    socket,
                    rtcDataChannelList,
                    onDataChannelOpen,
                    onDataChannelClose,
                    onSuccess,
                    sendCandidate,
                    onClose
                }) {
        this._configuration = configuration
        this._socket = socket
        this._onDataChannelOpen = onDataChannelOpen
        this._onDataChannelClose = onDataChannelClose
        this._onClose = onClose

        // 连接
        this._pc = new RTCPeerConnection(new RTCSessionDescription(this._configuration))

        // 创建数据通道

        rtcDataChannelList.forEach(({ label, onMessage }) => {
            console.log(`WebRTC Create Data Channel: ${label}`)
            this.createChannel({ label, onMessage })
        })

        // 数据流
        console.log('初始化数据流')
        this._mediaStream = new MediaStream()
        this._rtcVideoSource = new RTCVideoSource()
        const videoTrack = this._rtcVideoSource.createTrack()
        this._mediaStream.addTrack(videoTrack)
        this._pc.addTrack(videoTrack, this._mediaStream)

        console.log('监听 icecandidate')
        this._pc.addEventListener('icecandidate', ({ candidate }) => {
            if (!candidate) return
            sendCandidate(candidate)
        })

        console.log('监听 iceconnectionstatechange')
        this._pc.addEventListener('iceconnectionstatechange', (e) => {
            console.log(e)
            console.log('iceConnectionState: ' + e.iceConnectionState)
            // if (rc.iceConnectionState == "failed") {
            //   // this.close();
            //   onError && onError(new Error(" WebRTC 连接失败！"));
            //   this.close();
            // }
        })

        console.log('监听 connectionstatechange')
        this._pc.addEventListener('connectionstatechange', () => {
            console.log('WebRTC Connection state change: ' + this._pc.connectionState)
            switch (this._pc.connectionState) {
                case 'connected':
                    if (!this.connected) {
                        this.connected = true
                        onSuccess()
                        this._rtcVideoSource.start()
                    }
                    break
                case 'disconnected':
                    if (this.connected) {
                        this.connected = false
                        this._rtcVideoSource.stop()
                    }
                    break
                case 'failed':
                    // One or more transports has terminated unexpectedly or in an error
                    this.connected = false
                    this._rtcVideoSource.stop()
                    break
                case 'closed':
                    // The connection has been closed
                    this.connected = false
                    this.close()
                    break
            }
        })


        this._pc.createOffer().then((offer) => {
            // this._pc.setLocalDescription(offer)
            this.onOffer(offer)
            console.log('创建 offer 和 设置本地描述 success')
        }).then(() => {
            console.log('发送offer')
            const option = {
                type: 'offer', payload: this._pc.localDescription, name: 'terminal', targetName: 'browser'
            }
            // console.log(JSON.stringify(option))
            this._socket.send(JSON.stringify(option))
        })


    }

    onOffer(offer) {
        this._pc.setLocalDescription(new RTCSessionDescription(offer))
    }

    onAnswer(answer) {
        if (answer === null) {
            console.log('answer is nullable')
            return
        }
        this._pc.setRemoteDescription(new RTCSessionDescription(answer))
        // this._socket.send(new SocketMessage('answer', answer, 'terminal', 'server'))
    }

    addCandidate(candidate) {
        if (!candidate) return
        console.log('remote candidate', candidate.candidate)
        this._pc.addIceCandidate(new RTCIceCandidate(candidate))
    }

    /**
     * 创建数据通道
     * @param label 通道标签
     * @param onMessage 通道消息方法体
     */
    createChannel({ label = 'controller', onMessage }) {
        const channel = this._pc.createDataChannel(label)
        console.log(`创建数据通道${label}`)
        channel.addEventListener('open', () => {
            console.log(`Data Channel[${label}] open`)
            this._onDataChannelOpen(channel)
        })

        channel.addEventListener('message', ({ data }) => {
            // logger.info("Controller Data Channel", data);
            onMessage && onMessage(data)
        })
        channel.addEventListener('close', () => {
            this._onDataChannelClose(channel)
        })
        return channel
    }

    // openVideoStream() {
    //     if (!this._receiveVideoTrack) return
    //     if (!this.videoSink) {
    //         this.videoSink = new nonstandard.RTCVideoSink(this._receiveVideoTrack)
    //     }
    //     this.videoSink.onframe = ({ frame }) => {
    //         // Do something with the received frame.
    //         console.log('llll', frame.data)
    //     }
    // }

    close() {
        if (!this._pc) return
        console.log('Webrtc close!')
        this._rtcVideoSource.stop()
        this.videoSink && this.videoSink.stop()
        this._pc.close()
        // this._pc = undefined
        this._onClose()
    }
}

module.exports = {
    WebRTC
}
