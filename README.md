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

现在可以使用网站来快速制定比赛订阅：[https://www.tanknee.cn/LOL_Game_Subscription/#/](https://tanknee.github.io/LOL_Game_Subscription/#/)

### Web网页

![image-20220111123901226](https://img.tanknee.cn/blogpicbed/2022/01/11/2022011114d1b2e035f3c.png)

### 手机

![image-20220111123938686](https://img.tanknee.cn/blogpicbed/2022/01/11/20220111ad5e4abe1e019.png)

完整赛程链接：

```
https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/${gameType}/${gameType}.ics
```

- gameType可取的值为2021_ldl，2021_lpl。

示例：https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/2021_lpl/2021_lpl.ics

各个战队的链接：

```
https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/${gameType}/team/${teamName}.ics
```

- gameType可取的值为2021_ldl，2021_lpl,2021_msi等等。
- teamName是战队名，例如RNG，WE，EDG等等，可取的值详见文件夹内的文件名。

示例：https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/2021_lpl/team/RNG.ics

---

iOS请将链接复制到备忘录打开，Android用户也可以这样尝试一下，不行的话可以找个日历订阅软件。

带提醒的日历请在`.ics`之前加上`-alarm`。

示例：https://cdn.jsdelivr.net/gh/TankNee/LOL_Game_Subscription/2021_lpl/2021_lpl-alarm.ics
