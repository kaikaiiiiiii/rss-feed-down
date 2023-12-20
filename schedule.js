const fs = require('fs')

let data = fs.readFileSync('./schedule.sample.txt', 'utf8')
    .split('\n')
    .filter(line => line.trim().length > 0 && !line.startsWith('#'))
    .map(line => line.trim())

class scheduleHandler {
    constructor() {
        this.schedule = new Array(7).fill(0).map(() => new Array(24 * 60).fill(0));

    }

    nowSchedule() {
        let now = new Date()
        let weekday = now.getDay()
        let time = now.getHours() * 60 + now.getMinutes()
        return this.schedule[weekday][time]
    }

    addSchedule(line) {
        let [weekday, time, dl, ul] = line.split(';');
        if (!weekday || !time || !dl || !ul) {
            console.error(`Error: ${line}`)
            process.exit(1)
        }
        if (weekday.includes('0')) { weekday = '1,2,3,4,5,6,7' }

        let wks = weekday.split(',').map(wk => parseInt(wk) - 1)
        let hms = time.split(',').map(e => {
            let [SH, SM, EH, EM] = e.split(/[-:]/)
            return { SH, SM, EH, EM }
        });

        console.log(wks, hms, dl, ul)

    }
}

let sh = new scheduleHandler()
sh.addSchedule('1,2,3,4,5,6,7;00:00-23:59;0;0')