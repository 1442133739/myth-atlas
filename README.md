# World Myth Atlas

一个全栈交互式世界神话地图。它用 3D 地球展示世界各地神话、童话、民间传说和史诗母题，支持故事筛选、相似故事连线、朗读、登录和公开评论。

## 功能

- 3D 地球：拖拽旋转，滚轮缩放
- 蓝色海洋、褐绿陆地、真实海岸线和地貌起伏效果
- 300+ 神话、民间传说和童话故事点位
- 主题筛选、时代筛选、国家/地区筛选、搜索
- 相似神话关联线
- 故事详情卡和浏览器语音朗读
- 本地账号注册/登录
- 公开评论，评论存储在后端数据文件中

## 技术栈

- React
- TypeScript
- Vite
- Three.js
- Express
- JSON file store

## 本地运行

```bash
npm install
npm run dev
```

打开：

```text
http://127.0.0.1:5173/
```

## 构建

```bash
npm run build
```

## 数据说明

- 故事数据：`data/stories.json`、`data/extraStories.json`、`server/generatedStories.ts`、`server/moreGeneratedStories.ts`
- 用户数据：`data/users.json`
- 评论数据：`data/comments.json`

当前用户和评论数据默认为空，运行后会由后端写入本地 JSON 文件。
