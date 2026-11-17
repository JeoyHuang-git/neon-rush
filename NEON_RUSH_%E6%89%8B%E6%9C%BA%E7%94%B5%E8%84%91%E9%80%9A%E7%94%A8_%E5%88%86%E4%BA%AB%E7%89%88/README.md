# NEON RUSH — 手机/平板/电脑跨设备分享版

## 这是可分享的游戏源码，不是已经上线的网址
- Windows/Mac：Chrome/Edge/Safari，键盘 ← → ↑ ↓ 或 WASD、空格。
- iPhone/安卓/平板：触屏按钮，或在游戏画面上左右/上下滑动。
- 生命 3 格、收集金币、积分、本机最高分、难度提升、音效开关、暂停和重开。
- 最高分由浏览器 localStorage 保存，**不同玩家的成绩不会共享**。
- 首次加载 Three.js 需要能连接 cdn.jsdelivr.net 的网络，部分网络可能无法加载。

## 免费发布到 GitHub Pages（只需要网页操作）
1. 登录 https://github.com 。点击右上角 + → New repository。
2. Repository name 填 `neon-rush`，Visibility 选 Public，点击 Create repository。
3. 进入新建仓库，点击 Add file → Upload files，将**解压后的** `index.html`、`game.js`、`style.css` 等文件直接上传到仓库根目录（不要只上传 ZIP，也不要让 index.html 藏在子目录）。Commit changes。
4. 点击 Settings → Pages，在 Build and deployment → Source 选 `Deploy from a branch`。
5. Branch 选 `main`，文件夹选 `/(root)`，Save。等待页面显示发布地址。
6. 分享页面给朋友：`https://你的GitHub用户名.github.io/neon-rush/`（仅格式示例，不是现成可用链接）。
7. 把这个**真实的网页地址**在电脑、iPhone、安卓设备分别试一遍。

## 本机先预览
VS Code 安装 Live Server 扩展，右键 index.html → Open with Live Server。127.0.0.1 地址只能自己设备访问，不能给异地朋友用。

## 故障排查
- 黑屏：查看浏览器 Console 是否 CDN 下载失败或 WebGL 不支持。
- 手机上触控无效：确保点击开始后，在游戏画面滑动而非控制面板上滑动；或用底部按钮。
- 音乐无法自动播放：移动设备浏览器一般必须先点击“开始”才能解锁音频。
- 低端设备掉帧：此版本已降低移动端像素比例和星空粒子数，旧机型仍可能卡顿。

## 组成
- index.html：页面及开始/暂停/结束 HUD
- style.css：响应式布局与手机触控按钮
- game.js：Three.js 场景、障碍、操作、音效、计分和升级
- README.md：本说明
