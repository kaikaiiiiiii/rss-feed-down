let fs = require('fs');
let tunnel = require('tunnel');
let axios = require('axios');
let Parser = require('rss-parser');
let path = require('path');
let parser = new Parser();
let { Delay, readCSV, writeCSV, TransmissionRPC } = require('./util.js')
let config = fs.existsSync('./config.js') ? require('./config.js') : require('./config.sample.js')

// ========== config zone ==========
const TNL = tunnel.httpsOverHttp(config);

const transmissionOptions = {
    hostname: '192.168.0.49', port: 9091,
    path: '/transmission/rpc',  // Transmission Daemon 的 RPC 路径
    auth: { username: 'username', password: 'password' },
};

// torrent file save path
let savepath = ""
if (process.platform == 'win32') { savepath = "." }
if (process.platform == 'linux') { savepath = "/home/kaikai" }
// ========== config zone end ==========

// read rss feeds from file
let book = fs.readFileSync(path.join(__dirname, 'rssFeeds.txt'), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))
    .map(l => l.split(','))
    .map(l => ({
        name: l[0],
        pt: l[1].toLowerCase() !== 'bt' && l[1].toLowerCase() !== '0' && l[1].toLowerCase() !== 'false',
        url: l[2],
        useProxy: l[3] !== undefined,
    }));

// read rss history read before, avoid duplicate download on same torrent    
let history = readCSV(path.join(__dirname, 'history.csv'))
history = history.reduce((acc, cur) => {
    if (!acc.some(e => e.guid === cur.guid)) {
        acc.push(cur)
    }
    return acc
}, []);
writeCSV(path.join(__dirname, 'history.csv.bak'), history)

// main function
async function main() {
    let TMS = new TransmissionRPC(transmissionOptions)
    await TMS.initSession()
    let obj = await TMS.getSessionInfo()
    TMS.downloadDir = obj["download-dir"]
    TMS.btpath = path.join(TMS.downloadDir, "..", "BT")

    try {
        await Promise.all(book.map(async (rss) => {
            try {
                console.log(rss);
                await readRSS(rss, TMS); // Await the readRSS function
            } catch (error) {
                console.log("ERR: " + error.message);
            }
        }));
        process.exit(0);
    } catch (error) {
        console.log("ERR: " + error.message);
        process.exit(1);
    }
}

main()

// function: read rss feeds and download torrent files or magnet links
async function readRSS(rss, TMS) {
    return new Promise((resolve, reject) => {
        let config = { proxy: false };
        if (rss.useProxy) config.httpsAgent = TNL;
        axios.get(rss.url, config)
            .then(async (response) => {
                try {
                    const feed = await parser.parseString(response.data);
                    const list = feed.items.map(item => {
                        return {
                            source: rss.name,
                            title: item.title,
                            link: item.link,
                            guid: item.guid,
                            pub: item.pubDate,
                            torrentLink: item.enclosure?.url || item.link,
                            torrentSize: item.enclosure?.length || 0,
                            torrentType: item.enclosure?.type || 'application/x-bittorrent',
                        };
                    });
                    const newItems = list.filter(item => !history.some(e => e.guid == item.guid));
                    const downpath = rss.pt ? TMS.downloadDir : TMS.btpath
                    if (newItems.length > 0) {
                        for (const item of newItems) {
                            try {
                                if (item.torrentLink.startsWith('magnet') || rss.useProxy == false) {
                                    await TMS.addTorrent({ filename: item.torrentLink, labels: [item.source], "download-dir": downpath });
                                    await Delay(500);
                                } else {
                                    const response = await axios.get(item.torrentLink, Object.assign({ responseType: 'arraybuffer' }, config));
                                    const base64 = Buffer.from(response.data, 'binary').toString('base64');
                                    await TMS.addTorrent({ metainfo: base64, labels: [item.source], "download-dir": downpath });
                                    await Delay(5000);
                                }
                                history.push(item);
                            } catch (error) {
                                console.log("ERR: " + error.message);
                            }
                        }
                        writeCSV(path.join(__dirname, 'history.csv'), history);
                    }
                    resolve(); // Resolve the promise if everything is successful
                } catch (error) {
                    console.log("ERR: " + error.message);
                    reject(error); // Reject the promise if an error occurs
                }
            })
            .catch((err) => {
                console.log("ERR:" + err.message);
                reject(err); // Reject the promise if an error occurs
            });
    });
}
