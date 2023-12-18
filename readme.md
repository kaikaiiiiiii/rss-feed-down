## Transmission 的 RSS 脚本

#### rss.js
此脚本用于从 RSS 订阅中获取种子，并向 Transmission 发送下载任务。它读取 rssFeeds.txt 文件，遍历所有 RSS 条目，根据历史记录排除已下载，获取所有新种子，并添加到 Transmission 中，然后更新历史记录。脚本目前只适用于 Transmission。

#### rssFeeds.sample.txt

此文件包含要读取的 RSS 订阅。每一行都是一个新的 RSS。格式如下：
```
# RSS源名称,BT或PT, RSS 地址, 是否需要通过代理访问
DMHY,BT,https://share.dmhy.org/topics/rss/team_id/816/rss.xml,true
U2,PT,https://ut.dmhy.org/torrentrss.php?passkey=ffffffffffffffffffffffffffffffff&rsscart=1
```
行开头有 '#' 是注释。非 RSS 订阅的说明文字，或者是你不想下载的 RSS 都可以注释掉。

**实际使用前将其改名为 rssFeeds.txt。**

#### config.sample.js
如果使用代理，请将此文件重命名为 config.js 并修改内容。

#### seedStaticLogging.js
用于记录私有种子的上传数据。目前无用。后续计划根据数据绘制曲线。

#### 工作方式
1. 安装 nodejs 和 transmission-daemon
   ```bash
    sudo apt install nodejs transmission-daemon
    ```
2. 克隆此存储，并进入目录
    ```bash
    git clone https://github.com/kaikaiiiiiii/rss-feed-down.git
    cd rss-feed-down
    ```
3. 将 config.sample.js 重命名为 config.js，并更改内容（如果使用代理）
    ```bash
    mv config.sample.js config.js
    nano config.js
    ```
4. 将 rssFeeds.sample.txt 改为为 rssFeeds.txt，将 RSS 订阅添加到 rssFeeds.txt
    ```bash
    mv rssFeeds.sample.txt rssFeeds.txt
    nano rssFeeds.txt
    ```
5. 运行 npm install 安装依赖项
    ```bash
    npm i
    ```
6. 运行 node rss.js 从 RSS 订阅中下载种子文件或磁力链接
    ```bash
    node rss.js
    ```

所有脚本都没有自动执行的调度功能。可以使用 `crontab -e` 来安排定时执行。





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