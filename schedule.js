const fs = require('fs');
const { parse } = require('path');

let data = fs.readFileSync('./schedule.sample.txt', 'utf8')
    .split('\n')
    .filter(line => line.trim().length > 0 && !line.startsWith('#'))
    .map(line => line.trim())

class scheduleHandler {
    constructor() {
        this.schedule = [];
        this.cal = new Array(7).fill([]);
    }

    addSchedule(line) {
        let [days, time, dl, ul] = line.split(';');
        if (!days || !time || !dl || !ul) {
            console.error(`Error: ${line}`)
            process.exit(1)
        }
        if (days.includes('0')) { days = '1,2,3,4,5,6,7' }

        let wks = days.split(',').map(wk => (parseInt(wk) - 1) % 7)
        let hms = time.split(',').map(e => {
            let [SH, SM, EH, EM] = e.split(/[-:]/).map(e => parseInt(e))
            let start = SH + SM / 100
            let end = EH + EM / 100
            return { start, end }
        });
        let speed = { dl: parseInt(dl), ul: parseInt(ul) }
        hms.forEach(e => {
            this.schedule.push({ days: wks, time: e, speed: speed })
        })
    }

    addCalender(line) {
        let [days, time, dl, ul] = line.split(';');
        if (!days || !time || !dl || !ul) {
            console.error(`Error: ${line}`)
            process.exit(1)
        }
        if (days.includes('0')) { days = '1,2,3,4,5,6,7' }

        let wks = days.split(',').map(wk => (parseInt(wk) - 1) % 7)
        let hms = time.split(',').map(e => {
            let [SH, SM, EH, EM] = e.split(/[-:]/).map(e => parseInt(e))
            let start = SH * 100 + SM
            let end = EH * 100 + EM
            return { start, end }
        });
        let speed = { dl: parseInt(dl), ul: parseInt(ul) }
        wks.forEach(wk => {
            hms.forEach(hm => {
                this.cal[wk] = this.cal[wk].map(x => {
                    let result = []
                    // 如果不重合，直接返回
                    if (x.start > hm.end || x.end < hm.start) {
                        return x
                    }
                    // 如果完全包含被覆盖，返回null
                    if (x.start >= hm.start && x.end <= hm.end) {
                        return null
                    }
                    // 如果重合，返回切割后的结果
                    if (x.start < hm.start) {
                        result.push({ start: x.start, end: hm.start - 1, dl: x.dl, ul: x.ul })
                    }
                    if (x.end > hm.end) {
                        result.push({ start: hm.end + 1, end: x.end, dl: x.dl, ul: x.ul })
                    }
                    return result
                }).flat().filter(x => x != null)
                this.cal[wk].push({ start: hm.start, end: hm.end, dl: speed.dl, ul: speed.ul })
            })
        })
    }




    getSpeed(date = new Date()) {
        let day = date.getDay()
        let time = date.getHours() + date.getMinutes() / 100
        let speed = { dl: 0, ul: 0 }
        this.schedule.forEach(e => {
            if (e.days.includes(day) && e.time.start <= time && time <= e.time.end) {
                speed = e.speed
            }
        })
        return speed
    }
}

let sh = new scheduleHandler()
data.forEach(line => sh.addCalender(line))

console.log(sh.cal)