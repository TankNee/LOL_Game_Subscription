<h2 align="center">LOL Prefessional Match Calendar Subscription</h2>
利用GitHub提供的自动化能力，每天自动抓取LPL以及LDL的比赛数据，并通过CDN来提供webcal链接，以此来实现自动化日历的效果。
部分日历可能不支持使用链接导入？可以使用一些第三方软件来订阅日历链接。

目前已经提供的数据有：

- LPL
  - LPL可获取的全部赛程
  - 各个战队的赛程
- LDL
  - LDL可获取的全部赛程
  - 各个战队的赛程

如何获取订阅日历链接：

完整赛程链接：

```
https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/${gameType}/${gameType}.ics
```

- gameType可取的值为ldl，lpl。

示例：https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/lpl/lpl.ics

各个战队的链接：

```
https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/${gameType}/team/${teamName}.ics
```

- gameType可取的值为ldl，lpl。
- teamName是战队名，例如RNG，WE，EDG等等，可取的值详见文件夹内的文件名。

示例：https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/lpl/team/RNG.ics
