#!/bin/zsh
set -eu
museRoot="${0:A:h}"
museUrl="http://127.0.0.1:3010"
if /usr/bin/curl -fsS -H "Origin: $museUrl" -H "x-toonflow-workspace: 1" "$museUrl/api/muse/status" >/dev/null 2>&1; then
  /usr/bin/open "$museUrl"
  print "MUSE 已运行：$museUrl"
  exit 0
fi
if /usr/sbin/lsof -nP -iTCP:3010 -sTCP:LISTEN >/dev/null 2>&1; then
  print "3010 端口已被其他服务占用，未修改该服务。"
  exit 1
fi
museBun="$museRoot/runtime/package/bin/bun"
if [[ ! -x "$museBun" ]]; then museBun="$(command -v bun || true)"; fi
[[ -x "$museBun" && -f "$museRoot/toonflow/build/server/index.js" ]] || { print "缺少运行文件，请参阅部署说明。"; exit 1; }
cd "$museRoot/toonflow"
export PATH="$museRoot/runtime/package/bin:$PATH"
export TOONFLOW_SERVER_PORT=3010
print "MUSE 地址：$museUrl"
print "请保留此终端；按 Ctrl+C 停止服务。页面打开后稍等片刻或刷新。"
/usr/bin/open "$museUrl"
exec "$museBun" "$museRoot/toonflow/build/server/index.js"
