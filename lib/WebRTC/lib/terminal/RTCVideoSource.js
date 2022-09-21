const { nonstandard: { RTCVideoSource: OriginRTCVideoSource, rgbaToI420 } } = require('wrtc')
const ffmpeg = require('fluent-ffmpeg')

class RTCVideoSource extends OriginRTCVideoSource {
    command
    cache

    /**
     * 构造方法 初始化 命令和内部缓存
     */
    constructor() {
        super()
        this.command = null
        this.cache = Buffer.alloc(0)
    }

    createTrack() {
        // if (this.command === null) {
        //   this.start();
        // }
        return super.createTrack()
    }

    /**
     * 使用ffmpeg读取摄像头的视频流
     * @returns {Promise<void>}
     */
    async start() {
        if (this.command !== null) {
            this.stop() // stop existing process
        }

        console.log('Video source start')
        let width = 1280, height = 720

        const bufferSize = width * height << 3
        const videoSize = width * height << 2

        this.command = ffmpeg('video=USB2.0 Camera') // See above article
            .inputFormat('dshow')
            .format('rawvideo') // 'mjpeg'
            .native()
            .outputOptions([
                '-vcodec h264_qsv',
                '-pixel_format yuv420p',
                // '-framerate 30',
                `-video_size ${width}x${height}`,
                //`-s ${width}x${height}`,
                '-b:v 15000k',
                `-bufsize 33000k`,
                // '-maxrate 11000k',
                // '-threads 2',
                '-crf 18', `-bufsize 9000k`
                // '-preset:v ultrafast',
                // '-tune:v zeolatency'
            ])
            .on('start', () => {
                console.log('Video processing start !')
            })
            .on('error', function(err) {
                console.log('Video processing An error occurred: ' + err.message)
            })
            .on('end', function() {
                console.log('Video processing finished !')
            })

        const ffStream = this.command.pipe()


        ffStream.on('data', (chunk) => {
            // console.log(chunk)
            console.log('保存的 chunk为： ', chunk.length)


            this.cache = Buffer.concat([this.cache, chunk])

        })

        const i420Data = new Uint8ClampedArray(width * height * 1.5)
        const i420Frame = { width, height, data: i420Data }
        this.interval = setInterval(() => {
            if (this.cache.length >= videoSize) {
                const buffer = this.cache.slice(0, videoSize)
                this.cache = this.cache.slice(videoSize)
                rgbaToI420({
                    width, height, data: new Uint8ClampedArray(buffer)
                }, i420Frame)

                this.onFrame(i420Frame)

                // this.onFrame({
                //     width, height, data: new Uint8ClampedArray(buffer)
                // })
            }
        })

        // this.pipe.on('drain', () => {
        //   console.log("Video cameraVideoStream drain");
        // })
        ffStream.on('error', () => {
            console.log('Video cameraVideoStream error')
        })
        ffStream.on('finish', () => {
            console.log('Video cameraVideoStream finish')
        })

        // 需要优化 rgba i420

        // const processData = () => {
        //     while (this.cache.length > videoSize) {
        //         const buffer = this.cache.slice(0, videoSize)
        //         this.cache = this.cache.slice(videoSize)
        //         rgbaToI420({
        //             width, height, data: new Uint8ClampedArray(buffer)
        //         }, i420Frame)
        //         this.onFrame(i420Frame)
        //         // this.onFrame({
        //         //     width, height, data: new Uint8ClampedArray(buffer)
        //         // })
        //     }
        //     if (this.command !== null) {
        //         setTimeout(() => processData())
        //     }
        // }
        // processData()
    }

    stop() {
        console.log('Video source stop')
        if (this.command !== null) {
            clearInterval(this.interval)
            this.command.kill('SIGKILL')
            this.command = null
        }
    }
}

module.exports = {
    RTCVideoSource
}
