import net from 'node:net'
import fs from 'node:fs'
import path from 'node:path'
import { Stream, Readable, Writable } from 'node:stream'

let counter = 0

class UnixStream {
  url: string
  socketPath: string

  constructor(stream: Stream, onSocket: (socket: net.Socket) => void) {
    if (process.platform === 'win32') {
      const pipePrefix = '\\\\.\\pipe\\'
      const pipeName = `node-webrtc.${++counter}.sock`

      this.socketPath = path.join(pipePrefix, pipeName)
      this.url = this.socketPath
    } else {
      this.socketPath = `./${++counter}.sock`
      this.url = `unix:${this.socketPath}`
    }

    try {
      fs.statSync(this.socketPath)
      fs.unlinkSync(this.socketPath)
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    const server = net.createServer(onSocket)
    stream.on('finish', () => {
      server.close()
    })
    server.listen(this.socketPath)
  }
}

function StreamInput(stream: Readable): UnixStream {
  return new UnixStream(stream, (socket) => stream.pipe(socket))
}

function StreamOutput(stream: Writable): UnixStream {
  return new UnixStream(stream, (socket) => socket.pipe(stream))
}

export { StreamOutput, StreamInput }
