/**
 * 前端网页端使用的 webrtc
 * @type {WebRTC}
 */
module.exports = class WebRTC {
    constructor(configuration,
                socket,
                onOffer,
                onClose,
                onSuccess,
                rtcDataChannelList,
                onDataChannelOpen,
                onDataChannelClose) {
        this._configuration = configuration
        this._socket = socket
        this._onOffer = onOffer
        this._onClose = onClose
        this._onSuccess = onSuccess
        this._rtcDataChannelList = rtcDataChannelList
        this._onDataChannelOpen = onDataChannelOpen
        this._onDataChannelClose = onDataChannelClose
    }

}

