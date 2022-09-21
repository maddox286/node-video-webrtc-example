## WebRtc front end



<interface>

- onOffer(offer): void
- sendCandidate(candidate): void
- peerConnection(configuration): PeerConnection



```js
const onOffer = async (offer) => {}

const sendCandidate = (candidate) => {
    // 
    ws.send({xxx, candidate})
}
```

