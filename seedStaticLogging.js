const { readCSV, writeCSV, TransmissionRPC } = require('./util.js')
const path = require('path');

// let selectedFields = ["hashString", "id", "status", "name", "uploadedEver", "totalSize", "dateCreated", "isPrivate",
// "isFinished", "addedDate", 'webseeds', ""] // there's another segment "datePublish" from history
let selectedFields = ["activityDate", "addedDate", "availability", "bandwidthPriority", "comment", "corruptEver", "creator", "dateCreated", "desiredAvailable", "doneDate", "downloadDir", "downloadedEver", "downloadLimit", "downloadLimited", "editDate", "error", "errorString", "eta", "etaIdle", "file-count", "files", "fileStats", "group", "hashString", "haveUnchecked", "haveValid", "honorsSessionLimits", "id", "isFinished", "isPrivate", "isStalled", "labels", "leftUntilDone", "magnetLink", "manualAnnounceTime", "maxConnectedPeers", "metadataPercentComplete", "name", "peer-limit", "peers", "peersConnected", "peersFrom", "peersGettingFromUs", "peersSendingToUs", "percentComplete", "percentDone", "pieces", "pieceCount", "pieceSize", "priorities", "primary-mime-type", "queuePosition", "rateDownload (B/s)", "rateUpload (B/s)", "recheckProgress", "secondsDownloading", "secondsSeeding", "seedIdleLimit", "seedIdleMode", "seedRatioLimit", "seedRatioMode", "sequentialDownload", "sizeWhenDone", "startDate", "status", "trackers", "trackerList", "trackerStats", "totalSize", "torrentFile", "uploadedEver", "uploadLimit", "uploadLimited", "uploadRatio", "wanted", "webseeds", "webseedsSendingToUs"]

const transmissionOptions = {
    hostname: '192.168.0.49', port: 9091, // Transmission Daemon 的服务器 IP 和端口
    path: '/transmission/rpc',  // Transmission Daemon 的 RPC 路径
    auth: { username: 'username', password: 'password' },
    fields: selectedFields
};


/* Status
0	Torrent is stopped
1	Torrent is queued to verify local data
2	Torrent is verifying local data
3	Torrent is queued to download
4	Torrent is downloading
5	Torrent is queued to seed
6	Torrent is seeding
*/

async function main() {

    let TMS = new TransmissionRPC(transmissionOptions)
    await TMS.initSession()
    let torrents = await TMS.getTorrentsInfo(selectedFields)
    let history = readCSV(path.join(__dirname, 'history.csv'));

    // add datePublish time to torrents
    torrents.forEach(torrent => {
        let item = history.find(e => e.guid == torrent.hashString)
        if (item) { torrent.datePublish = ~~(new Date(item.pub).getTime() / 1000) }
        else {
            torrent.datePublish = torrent.dateCreated || torrent.addedDate
        }
    })

    // log private torrents data with timestamp
    let data = readCSV(path.join(__dirname, 'seedStatic.csv')) // read old data
    let now = ~~(new Date().getTime() / 1000)
    let nowdata = torrents.filter(tor => tor.isPrivate == true)
        .map(tor => {
            let o = {
                hashString: tor.hashString,
                name: tor.name,
                size: tor.totalSize,
                upload: tor.uploadedEver,
                datePublish: tor.datePublish,
                timestamp: now,
                datePubReadable: new Date(tor.datePublish * 1000).toLocaleString(),
                timestampReadable: new Date(now * 1000).toLocaleString(),
                trackerStats: JSON.stringify(tor.trackerStats),
            }
            return o
        })
    // only keep data of torrent that are now in transmission
    data = data.filter(e => nowdata.some(t => t.hashString == e.hashString))
        .concat(nowdata)
    console.log(data)
    writeCSV(path.join(__dirname, 'seedStatic.csv'), data)
    process.exit(0)
}

main()

