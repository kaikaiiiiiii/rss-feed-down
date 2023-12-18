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

// read rss feeds from file
let book = fs.readFileSync(path.join(__dirname, 'rssFeeds.txt'), 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))
    .map(l => l.split(','))
    .map(l => ({ name: l[0], url: l[1], useProxy: l[2] !== undefined }));

// main function
async function main() {
    let content = await readRSS(book[0]);
    console.log(content);
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
                    resolve(feed); // Resolve the promise if everything is successful
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
