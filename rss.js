let fs = require('fs');
let tunnel = require('tunnel');
let axios = require('axios');
let Parser = require('rss-parser');
let path = require('path');
let parser = new Parser();


// ========== config zone ==========
const clash = tunnel.httpsOverHttp({
    proxy: {
        host: '127.0.0.1',
        port: 7890
    }
});

// torrent file save path
let savepath = ""
if (process.platform == 'win32') { savepath = "C:\\Users\\kaikai\\Desktop" }
if (process.platform == 'linux') { savepath = "/home/kaikai" }

// ========== config zone end ==========


let Delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let book = fs.readFileSync(path.join(__dirname, 'rssFeeds.txt'), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))
    .map(l => l.split(','))
    .map(l => ({ name: l[0], url: l[1], useProxy: l[2] !== undefined }));

function readHistory() {
    let history = []
    try { history = JSON.parse(fs.readFileSync(path.join(__dirname, 'history.json'), 'utf8')) } catch (e) { }
    history = history.reduce((acc, cur) => {
        if (!acc.some(e => e.guid = cur.guid)) {
            acc.push(cur)
        }
        return acc
    }, []);
    fs.writeFileSync(path.join(__dirname, 'history.json.bak'), JSON.stringify(history, null, 2))
    return history
}

let history = readHistory()

async function readRSS(rss) {
    let config = { proxy: false }
    if (rss.useProxy) config.httpsAgent = clash;
    axios.get(rss.url, config).then((response) => {
        parser.parseString(response.data)
            .then(async (feed) => {
                let list = feed.items.map(item => {
                    return {
                        source: rss.name,
                        title: item.title,
                        link: item.link,
                        guid: item.guid,
                        torrentLink: item.enclosure.url,
                        torrentSize: item.enclosure.length || 0,
                        torrentType: item.enclosure.type || 'application/x-bittorrent',
                    }
                });
                let newItems = list.filter(item => !history.some(e => e.guid == item.guid))
                if (newItems.length == 0) {
                    return
                } else {
                    for (let item of newItems) {
                        console.log(item)
                        try {
                            let response = await axios.get(item.torrentLink, Object.assign({ responseType: 'arraybuffer' }, config))
                            let towrite = path.join(savepath, `${item.title.replace(/[\/|*<>?]/g, '')}.torrent`)
                            fs.writeFileSync(towrite, response.data)
                            history.push(item)
                        } catch (error) {
                            console.log(error)
                        }
                        await Delay(1000)
                    }
                    fs.writeFileSync('./history.json', JSON.stringify(history, null, 2))
                }
            })
    }, err => console.log("ERR:" + err))
}

async function main() {

    for (let i = 0; i < book.length; i++) {
        console.log(book[i])
        try {
            await readRSS(book[i])
        } catch (error) { }
    }

}

main()