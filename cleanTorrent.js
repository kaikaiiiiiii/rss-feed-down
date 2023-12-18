const { TransmissionRPC } = require('./util.js')

let selectedFields = ["id", "status", "isPrivate", "isFinished"]

const transmissionOptions = {
    hostname: '192.168.0.49', port: 9091, // Transmission Daemon 的服务器 IP 和端口
    path: '/transmission/rpc',  // Transmission Daemon 的 RPC 路径
    auth: { username: 'username', password: 'password' },
    fields: selectedFields
};

async function main() {

    let TMS = new TransmissionRPC(transmissionOptions)
    await TMS.initSession()

    let torrents = await TMS.getTorrentsInfo(selectedFields)

    torrents = torrents.filter(tor => tor.isPrivate == false)
        .filter(tor => tor.status == 5 || tor.status == 6 || tor.isFinished == true)

    await TMS.removeTorrents(torrents, false)
    process.exit(0)
}

main()

