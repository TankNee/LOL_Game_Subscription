const request = require("superagent");
const icsTool = require("ics");
const fs = require("fs");
const API_URL = "https://lpl.qq.com/web201612/data/LOL_MATCH2_MATCH_HOMEPAGE_BMATCH_LIST.js";
/**
 *
 * @param {{}[]} games
 */
function packageGames(games) {
    return games.map((game) => {
        const gameDate = new Date(game.MatchDate);
        let gameName = game.bMatchName;
        const hasResult = parseInt(game.ScoreA) || parseInt(game.ScoreB);
        if (hasResult) {
            gameName += ` ${game.ScoreA} : ${game.ScoreB}`;
        }
        return {
            title: gameName,
            description: `${game.GameName}${game.GameTypeName}${game.GameProcName}`,
            start: [gameDate.getFullYear(), gameDate.getMonth() + 1, gameDate.getDate(), gameDate.getHours(), gameDate.getMinutes()],
            end: [gameDate.getFullYear(), gameDate.getMonth() + 1, gameDate.getDate(), gameDate.getHours() + 2, gameDate.getMinutes()],
            organizer: {
                name: `英雄联盟${game.GameName}`,
            },
            url: "https://lpl.qq.com/es/live.shtml",
            status: "TENTATIVE",
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
        if (!result[teamA.trim()]) {
            result[teamA.trim()] = [];
        }
        if (!result[teamB.trim()]) {
            result[teamB.trim()] = [];
        }
        result[teamA.trim()].push(game);
        result[teamB.trim()].push(game);
    });
    return result;
}

async function main() {
    const buffer = (await request.get(API_URL)).body;
    const gameBundle = JSON.parse(buffer);
    const ldlGameInfo = gameBundle.msg.filter((game) => game.GameName.includes("发展联赛"));
    const lplGameInfo = gameBundle.msg.filter((game) => game.GameName.includes("职业联赛"));

    const ldlTeams = getTeams(ldlGameInfo);
    const lplTeams = getTeams(lplGameInfo);

    const ldlGames = packageGames(ldlGameInfo);
    const lplGames = packageGames(lplGameInfo);

    const ldlResult = icsTool.createEvents(ldlGames);
    if (ldlResult.error) {
        console.error(ldlResult.error);
    } else {
        fs.writeFileSync("./ldl/ldl.ics", ldlResult.value);
    }
    const lplResult = icsTool.createEvents(lplGames);
    if (lplResult.error) {
        console.error(lplResult.error);
    } else {
        fs.writeFileSync("./lpl/lpl.ics", lplResult.value);
    }
    // Team Game
    for (const key in ldlTeams) {
        if (Object.hasOwnProperty.call(ldlTeams, key)) {
            const team = ldlTeams[key];
            const teamResult = icsTool.createEvents(packageGames(team));
            if (teamResult.error) {
                console.error(teamResult.error);
            } else {
                fs.writeFileSync(`./ldl/team/${key}.ics`, teamResult.value);
            }
        }
    }
    for (const key in lplTeams) {
        if (Object.hasOwnProperty.call(lplTeams, key)) {
            const team = lplTeams[key];
            const teamResult = icsTool.createEvents(packageGames(team));
            if (teamResult.error) {
                console.error(teamResult.error);
            } else {
                fs.writeFileSync(`./lpl/team/${key}.ics`, teamResult.value);
            }
        }
    }
}

main();
