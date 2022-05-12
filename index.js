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
        const gameDate = new Date(game.MatchDate);
        const gameEndDate = new Date(gameDate.getTime() + 2 * 60 * 60 * 1000);
        // const alarmDate = new Date(gameDate.getTime() - 30 * 60 * 1000);
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
            },
            url: "https://github.com/TankNee/LOL_Game_Subscription",
            status: "TENTATIVE",
            calName: calName ? calName : `英雄联盟${game.GameName}`,
            geo: { lat: 30.0095, lon: 120.2669 },
            startInputType: "local",
            startOutputType: "utc",
            endInputType: "local",
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
    games.forEach((game) => {
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
        // console.log(`${gameName.rawName}赛程构造成功！`);
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
                // console.log(`${gameName.rawName}中的${key}赛程构造成功！`);
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

async function main() {
    const buffer = (await request.get(API_URL)).body;
    const gameBundle = JSON.parse(buffer);
    const games = extractGames(gameBundle);
    buildFolders(games);
    games
        // .filter((g) => ["2021_lpl", "2021_msi"].includes(g.abbreviation))
        .forEach((game) => {
            generateICS(gameBundle, false, game);
            generateICS(gameBundle, true, game);
        });
}

main();
