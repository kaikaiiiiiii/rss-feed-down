## rss scripts for transmission 

#### rss.js

This script is used to download torrents from rss feeds. It is designed to be used with transmission. It will read rssFeeds.txt, download all seeds in all rss NOT in history log, and add them to transmission. It will also update the history log with the new seeds.

#### rssFeeds.txt

This file contains the rss feeds to be read. Each line is a new feed. The format is as follows:
```
# SourceName, URL, useProxy
DMHY,https://share.dmhy.org/topics/rss/team_id/816/rss.xml,true
```
Add a '#' at the beginning of a line to comment it. Either it's not a rss feed, or a rss you don't want to download.

#### config.sample.js

Rename this file to config.js and change the content if you use a proxy.

#### seedStaticLogging.js

Logging upload data for private torrents. No use for now. I'm planning to write script to draw curves from the data.

## How it works

0. Install nodejs and transmission-daemon
1. Clone this repo
2. Rename config.sample.js to config.js and change the content if you use a proxy
3. Add rss feeds to rssFeeds.txt
4. Run `npm install` to install dependencies
5. Run `node rss.js` to download torrents or magnet link from rss feeds

All scripts have no automatic scheduling. You can use crontab -e to schedule them.