# 第三方来源

| 来源 | 用途 | 许可及说明 |
|---|---|---|
| [HBAI-Ltd/Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app) | 创作工作台、画布节点、工作区、服务端 | 基线 `ecd5325c7f9b38721491382ee6952fa2318b4693`；保留 `integration/toonflow/LICENSE`，Copyright (c) 2026 HBAI-Ltd |
| [fabricjs/fabric.js](https://github.com/fabricjs/fabric.js) | 商品对象编辑与 PNG | 7.4.0；通过依赖安装，遵循其 MIT 许可证 |
| [FFmpeg](https://ffmpeg.org/) | 静帧 MP4 编码、媒体信息读取 | 本仓库不分发运行时二进制；使用者需核对所用构建的 LGPL / GPL 许可 |
| 预置商品与剧照 | 交互演示、示例项目与验收 | 使用 imagegen 生成的虚构展示素材；不是 DeepSeek、FLUX 或 Runway 的实测媒体结果 |

MUSE 二次开发集中于 `packages/ext/museStudio/`、`apps/server/src/routes/muse/`、`apps/server/src/utils/muse/`，以及模型密钥解析、Web / Server 构建边界、回环监听与画布目录刷新。完整源码与基线可逐文件比较。
