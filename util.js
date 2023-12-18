const fs = require('fs')
const path = require('path')
const papa = require('papaparse')
const axios = require('axios')

function magicMath(list) {
    let A = list.map(e => formulaA(e.week, e.nodes, e.size))
    let B = 50 / Math.PI * Math.atan(A / 300)
    let C = Math.max(14, list.length) * 0.7
    return B + C
}

function formulaA(Week, Nodes, Size) {
    let S = Size / 1024 / 1024 / 1024 // GB
    let N = 1 + Math.sqrt(2) * (10 ** ((1 - Nodes) / 6))
    let T = 1 - 10 ** (-Week / 4)
    return S * N * T
}

function readRSSHistory() {
    let history = []
    try { history = JSON.parse(fs.readFileSync(path.join(__dirname, 'history.json'), 'utf8')) } catch (e) { }
    fs.writeFileSync(path.join(__dirname, 'history.json.bak'), JSON.stringify(history, null, 2))
    return history
}

function Delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCSV(file) {
    let data = []
    try {
        let csv = fs.readFileSync(file, 'utf8')
        data = papa.parse(csv, { header: true }).data
    } catch (e) { }
    return data
}

function writeCSV(file, data) {
    let csv = papa.unparse(data, { header: true })
    fs.writeFileSync(file, csv, 'utf8')
}


class TransmissionRPC {
    constructor(config) {
        this.sessionId = ''
        this.rpcURL = `http://${config.hostname}:${config.port}${config.path}`;
        this.auth = config.auth
        this.retry = config.retry || 3
        this.fields = config.fields || ["hashString", "id", "status", "name", "isPrivate"]
        this.downloadDir = ""
    }

    async initSession() {
        try {
            const response = await axios.post(this.rpcURL, {
                method: 'session-get',
                auth: this.auth
            });
            this.sessionId = response.headers['x-transmission-session-id'];
            this.downloadDir = response.data.arguments["download-dir"]
        } catch (error) {
            if (error.response && error.response.status === 409) {
                this.sessionId = error.response.headers['x-transmission-session-id'];
            } else {
                throw error;
            }
        }
    }

    async getSessionInfo() {
        try {
            const response = await axios.post(this.rpcURL, {
                method: 'session-get',
            }, {
                auth: this.auth,
                headers: { 'X-Transmission-Session-Id': this.sessionId }
            });
            return response.data.arguments
        } catch (error) {
            throw error
        }
    }

    async moveTorrent(items, newPath) {
        try {
            await axios.post(this.rpcURL, {
                method: 'torrent-set-location',
                arguments: { ids: items.map(e => e.id), location: newPath, move: true }
            }, {
                auth: this.auth,
                headers: { 'X-Transmission-Session-Id': this.sessionId }
            });
        } catch (error) {
            throw error
        }
    }


    async getTorrentsInfo() {
        try {
            const response = await axios.post(this.rpcURL, {
                method: 'torrent-get',
                arguments: { fields: this.fields }
            }, {
                auth: this.auth,
                headers: { 'X-Transmission-Session-Id': this.sessionId }
            });
            let torrents = response.data.arguments.torrents
            return torrents
        } catch (error) {
            throw error
        }
    }

    async removeTorrents(items, deleteFile = false) {
        try {
            let result = await axios.post(this.rpcURL, {
                method: 'torrent-remove',
                arguments: { ids: items.map(e => e.id), 'delete-local-data': deleteFile }
            }, {
                auth: this.auth,
                headers: { 'X-Transmission-Session-Id': this.sessionId }
            });
            return result
        } catch (error) {
            throw error
        }
    }

    async addTorrent(torrent) {
        try {
            await axios.post(this.rpcURL, {
                method: 'torrent-add',
                arguments: torrent
            }, {
                auth: this.auth,
                headers: { 'X-Transmission-Session-Id': this.sessionId }
            });
            return true
        } catch (error) {
            throw error
        }
    }
}


module.exports = {
    magicMath,
    readRSSHistory,
    Delay,
    readCSV,
    writeCSV,
    TransmissionRPC
}


/*/test code

let tms = new TransmissionRPC({
    hostname: '192.168.0.49', port: 9091,
    path: '/transmission/rpc',  // Transmission Daemon 的 RPC 路径
    auth: { username: 'username', password: 'password' }
});

(async () => {
    await tms.updateSessionId()
    let result = await tms.addTorrent({ filename: `magnet:?xt=urn:btih:BZ255JZ4LBLUA4HSWJQJHFV6XHBAACBM&dn=&tr=http%3A%2F%2F104.143.10.186%3A8000%2Fannounce&tr=udp%3A%2F%2F104.143.10.186%3A8000%2Fannounce&tr=http%3A%2F%2Ftracker.openbittorrent.com%3A80%2Fannounce&tr=http%3A%2F%2Ftracker3.itzmx.com%3A6961%2Fannounce&tr=http%3A%2F%2Ftracker4.itzmx.com%3A2710%2Fannounce&tr=http%3A%2F%2Ftracker.publicbt.com%3A80%2Fannounce&tr=http%3A%2F%2Ftracker.prq.to%2Fannounce&tr=http%3A%2F%2Fopen.acgtracker.com%3A1096%2Fannounce&tr=https%3A%2F%2Ft-115.rhcloud.com%2Fonly_for_ylbud&tr=http%3A%2F%2Ftracker1.itzmx.com%3A8080%2Fannounce&tr=http%3A%2F%2Ftracker2.itzmx.com%3A6961%2Fannounce&tr=udp%3A%2F%2Ftracker1.itzmx.com%3A8080%2Fannounce&tr=udp%3A%2F%2Ftracker2.itzmx.com%3A6961%2Fannounce&tr=udp%3A%2F%2Ftracker3.itzmx.com%3A6961%2Fannounce&tr=udp%3A%2F%2Ftracker4.itzmx.com%3A2710%2Fannounce&tr=http%3A%2F%2Ft.acg.rip%3A6699%2Fannounce&tr=https%3A%2F%2Ftr.bangumi.moe%3A9696%2Fannounce&tr=http%3A%2F%2Ftr.bangumi.moe%3A6969%2Fannounce` })
    console.log(result)
})()

*/