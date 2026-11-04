#!/bin/zsh
set -eu
museRoot="${0:A:h}"
musePid="$(/usr/sbin/lsof -t -iTCP:3010 -sTCP:LISTEN 2>/dev/null || true)"
[[ "$musePid" == <-> ]] || { print "MUSE 服务未运行。"; exit 0; }
museCommand="$(/bin/ps -p "$musePid" -o command= 2>/dev/null || true)"
if [[ "$museCommand" == *bun* && "$museCommand" == *" $museRoot/toonflow/build/server/index.js" ]]; then
  kill -TERM "$musePid"
  print "MUSE 服务已停止，项目文件保留。"
else
  print "端口上的进程不属于本启动脚本，未停止。"
fi
