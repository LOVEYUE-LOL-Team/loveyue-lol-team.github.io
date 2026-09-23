# LOVEYUE LOL Team 数据舱

英雄联盟灵活排位数据的交互式展示站，发布于 LOVEYUE-LOL-Team Organization 的 GitHub Pages。

## 隐私设计

- 仓库不包含 `app/team-data.json` 原始对局文件。
- Pages 只发布经过 AES-256-GCM 加密的 `public/team-data.enc.json`。
- 共享密码不会写入源码或 GitHub Actions。
- 访客在浏览器中输入密码并本地解密；刷新页面后需要重新输入。

GitHub Pages 是静态托管，因此加密文件可以被下载。请使用足够长、随机的共享密码，避免可被离线猜测的短密码。

## 本地运行

```bash
npm ci
npm run dev
```

## 更新数据或更换密码

将新的原始数据保存为 `app/team-data.json`，然后仅在本地执行：

```bash
DASHBOARD_PASSWORD='至少16位的强密码' npm run encrypt:data
```

提交更新后的 `public/team-data.enc.json` 即可；不要提交原始 JSON 或密码。

## 发布

推送到 `main` 后，GitHub Actions 会构建并发布 `dist/client`。首次使用时，需要在仓库的 **Settings → Pages** 中将来源设置为 **GitHub Actions**。
