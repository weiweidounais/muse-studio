# MUSE Studio

面试用双场景交互原型：电商素材与短剧分镜。静态 HTML/CSS/JavaScript，无依赖安装。`dist/` 为可托管目录，三个方案文档在 `dist/docs/`。

启动：`python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`

所有模型生成均为明确标注的模拟／预置流程，不包含线上推理和服务端密钥。支持画布标题编辑与移动、PNG 导出、分镜 JSON 导出、模拟队列（并发 2）、失败重试与浏览器本地保存。图像资产由内置 imagegen 生成后预置，不是 DeepSeek、FLUX 或 Runway 实测结果。
