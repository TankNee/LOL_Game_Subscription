const request = require("superagent");
const icsTool = require("ics");
const fs = require("fs");
const API_URL = "https://lpl.qq.com/web201612/data/LOL_MATCH2_MATCH_HOMEPAGE_BMATCH_LIST.js";
/**
 *
 * @param {{}[]} games
 */
function packageGames(games, hasAlarm, calName) {
    return games.map((game) => {
        const gameDate = new Date(new Date(game.MatchDate).getTime() - 8 * 60 * 60 * 1000);
        const gameEndDate = new Date(gameDate.getTime() + 2 * 60 * 60 * 1000);
        let gameName = game.bMatchName;
        const hasResult = parseInt(game.ScoreA) || parseInt(game.ScoreB);
        if (hasResult) {
            gameName += ` - ${game.ScoreA} : ${game.ScoreB}`;
        }
        return {
            title: gameName,
            description: `${game.GameName}${game.GameTypeName}${game.GameProcName}`,
            start: [gameDate.getFullYear(), gameDate.getMonth() + 1, gameDate.getDate(), gameDate.getHours(), gameDate.getMinutes()],
            end: [gameEndDate.getFullYear(), gameEndDate.getMonth() + 1, gameEndDate.getDate(), gameEndDate.getHours(), gameEndDate.getMinutes()],
            organizer: {
                name: `英雄联盟${game.GameName}`,
                email: "lpl@qq.com",
            },
            url: "https://lpl.qq.com/es/live.shtml",
            status: "TENTATIVE",
            calName: calName ? calName : `英雄联盟${game.GameName}`,
            geo: { lat: 30.0095, lon: 120.2669 },
            startInputType: "utc",
            startOutputType: "utc",
            endInputType: "utc",
            endOutputType: "utc",
            alarms: hasAlarm && !hasResult ? [{ action: "audio", trigger: { minutes: 30, before: true, repeat: 1, attachType: "VALUE=URI", attach: "Glass" } }] : null,
        };
    });
}
/**
 *
 * @param {{}[]} games
 */
function getTeams(games) {
    const result = {};
    games
        .filter((g) => g.bMatchName.includes("vs"))
        .forEach((game) => {
            const teams = game.bMatchName.split("vs");
            const [teamA, teamB] = teams;
            try {
                if (!result[teamA.trim()]) {
                    result[teamA.trim()] = [];
                }
                if (!result[teamB.trim()]) {
                    result[teamB.trim()] = [];
                }
            } catch (err) {
                console.error(err);
                return null;
            }
            result[teamA.trim()].push(game);
            result[teamB.trim()].push(game);
            game.bMatchName = `${teamA.trim()} vs ${teamB.trim()}`
        });
    return result;
}
/**
 *
 * @param {{}} gameBundle
 * @param {boolean} hasAlarm
 * @param {string} gameName
 */
function generateICS(gameBundle, hasAlarm, gameName) {
    const gameInfo = gameBundle.msg.filter((game) => game.GameName === gameName.rawName);

    const teams = getTeams(gameInfo);

    const games = packageGames(gameInfo, hasAlarm);

    const result = icsTool.createEvents(games);

    if (result.error) {
        console.error(result.error);
    } else {
        fs.writeFileSync(`./${gameName.abbreviation}/${gameName.abbreviation}${hasAlarm ? "-alarm" : ""}.ics`, result.value);
    }

    // Team Game
    for (const key in teams) {
        if (Object.hasOwnProperty.call(teams, key)) {
            const team = teams[key];
            const teamResult = icsTool.createEvents(packageGames(team, hasAlarm, `${key}赛程`));
            if (teamResult.error) {
                console.error(teamResult.error);
            } else {
                fs.writeFileSync(`./${gameName.abbreviation}/team/${key}${hasAlarm ? "-alarm" : ""}.ics`, teamResult.value);
            }
        }
    }
}

function extractGames(gameBundle) {
    const games = [];
    const abbreviation = {
        发展联赛: "ldl",
        全球总决赛: "s-champion",
        职业联赛: "lpl",
        季中冠军赛: "msi",
        全明星赛: "all-star",
        德玛西亚杯: "demacia",
    };
    gameBundle.msg
        .filter((g) => /(\d+)([^\d]+)/g.test(g.GameName))
        .filter((g) => {
            let matches = /(\d+)([^\d]+)/g.exec(g.GameName);
            return abbreviation[matches[2]];
        })
        .forEach((game) => {
            let matches = /(\d+)([^\d]+)/g.exec(game.GameName);
            if (games.findIndex((g) => g.rawName === game.GameName) === -1) games.push({ rawName: game.GameName, abbreviation: `${matches[1]}_${abbreviation[matches[2]]}` });
        });
    return games;
}
/**
 *
 * @param {string[]} games
 */
function buildFolders(games) {
    games.forEach((game) => {
        fs.rmdirSync(`./${game.abbreviation}`, { recursive: true });
        if (!fs.existsSync(`./${game.abbreviation}`)) fs.mkdirSync(`./${game.abbreviation}`);
        if (!fs.existsSync(`./${game.abbreviation}/team`)) fs.mkdirSync(`./${game.abbreviation}/team`);
    });
}

async function dealLCKGames() {
    // 请求数据
    let games = []
    let yearStr = ""
    page = 1
    // 请先设置环境变量，Github Actions 需要在仓库 Settings - Security -  Secrets and variables - Actions - Variables 设置 TOKEN
    const TOKEN = process.env.TOKEN;
    console.log(TOKEN);
    while (true) {
        // API 文档及 Token 申请地址：https://pandascore.co
        let body = (await request.get(`https://api.pandascore.co/lol/matches?filter[league_id]=293&sort=&per_page=100&page=${page}`).set("Authorization", `Bearer ${TOKEN}`).set("Content-Type", "application/json")).body;
        // 仅处理当年的
        if (yearStr.length == 0) {
            yearStr = body[0].begin_at.split("-")[0]
        }
        let filtered = body.filter(function(item) {
            return item.serie.full_name.endsWith(yearStr);
        });
        games.push(...filtered);
        let lastOne = body[body.length - 1];
        let serieName = lastOne.serie.full_name;
        if (!serieName.endsWith(yearStr)) {
            break;
        } else {
            page++;
        }
    }
    games.reverse();
    
    // 移除之前的文件
    if (fs.existsSync(`./${yearStr}_lck`)) fs.rmdirSync(`./${yearStr}_lck`, { recursive: true });
    if (!fs.existsSync(`./${yearStr}_lck`)) fs.mkdirSync(`./${yearStr}_lck`);
    if (!fs.existsSync(`./${yearStr}_lck/team`)) fs.mkdirSync(`./${yearStr}_lck/team`);
    
    // 处理并生成没有提醒的全文件
    let gameObjsWithNoAlarms = games.map(function(game) {
        return lckGamesToICSObjs(game, false, yearStr);
    });
    let noAlarmFileName = `./${yearStr}_lck/${yearStr}_lck.ics`;
    generateLCKICSAndWrite(gameObjsWithNoAlarms, noAlarmFileName);
    
    // 处理并生成有提醒的全文件
    let gameObjsWithAlarms = games.map(function(game) {
        return lckGamesToICSObjs(game, true, yearStr);
    });
    let alarmFileName = `./${yearStr}_lck/${yearStr}_lck-alarm.ics`;
    generateLCKICSAndWrite(gameObjsWithAlarms, alarmFileName);
    
    // 生成各队伍有提醒和无提醒的文件
    let teams = games.map(function(item) {
        return [item.opponents[0].opponent.acronym, item.opponents[1].opponent.acronym]
    });
    let teamNames = [...new Set(teams.flat())];
    for (let teamName of teamNames) {
        let teamGameObjsWithNoAlarms = gameObjsWithNoAlarms.filter(function(game) {
            return game.title.split(" ").includes(teamName);
        });
        let noAlarmFileName = `./${yearStr}_lck/team/${teamName}.ics`
        generateLCKICSAndWrite(teamGameObjsWithNoAlarms, noAlarmFileName)
        let teamGameObjsWithAlarms = gameObjsWithAlarms.filter(function(game) {
            return game.title.split(" ").includes(teamName);
        });
        let alarmFileName = `./${yearStr}_lck/team/${teamName}-alarm.ics`
        generateLCKICSAndWrite(teamGameObjsWithAlarms, alarmFileName);
    }
}

function generateLCKICSAndWrite(games, fileName) {
    const result = icsTool.createEvents(games);
    if (result.error) {
        console.error(result.error);
    } else {
        fs.writeFileSync(fileName, result.value);
    }
}

function lckGamesToICSObjs(game, hasAlarm, yearStr) {
    const gameDate = new Date(new Date(game.original_scheduled_at).getTime() - 8 * 60 * 60 * 1000);
    const gameEndDate = new Date(gameDate.getTime() + 2 * 60 * 60 * 1000);
    let slug = game.slug;
    let gameName = game.name;
    if (game.status != "not_started") {
        scoreA = game.results[0].score
        scoreB = game.results[1].score
        gameName += ` - ${scoreA} : ${scoreB}`
    }
    return {
        title: gameName,
        description: slug,
        start: [gameDate.getFullYear(), gameDate.getMonth() + 1, gameDate.getDate(), gameDate.getHours(), gameDate.getMinutes()],
        end: [gameEndDate.getFullYear(), gameEndDate.getMonth() + 1, gameEndDate.getDate(), gameEndDate.getHours(), gameEndDate.getMinutes()],
        organizer: {
            name: slug
        },
        url: "https://www.twitch.tv/lck",
        status: "TENTATIVE",
        calName: `${yearStr}_lck`,
        startInputType: "utc",
        startOutputType: "utc",
        endInputType: "utc",
        endOutputType: "utc",
        // 提醒应该不用区分是否比赛结束
        alarms: hasAlarm ? [{ action: "audio", trigger: { minutes: 30, before: true, repeat: 1, attachType: "VALUE=URI", attach: "Glass" } }] : null,
    }
}

async function main() {
    const buffer = (await request.get(API_URL)).body;
    const gameBundle = JSON.parse(buffer);
    const games = extractGames(gameBundle);
    buildFolders(games);
    games
        .forEach((game) => {
            generateICS(gameBundle, false, game);
            generateICS(gameBundle, true, game);
        });
    dealLCKGames();
}

main();
