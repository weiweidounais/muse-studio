import conf from "@/utils/conf";

export function resolveProviderSecret(apiUrl: string, apiKey: string) {
  if (apiKey !== "server:deepSeek") return apiKey;
  const url = new URL(apiUrl);
  if (url.origin !== "https://api.deepseek.com" || url.username || url.password) throw Object.assign(new Error("服务端 DeepSeek 密钥只能用于已授权的官方接口"), { status: 400 });
  const key = conf.get("museSecrets", {}).deepSeek;
  if (!key) throw Object.assign(new Error("DeepSeek 服务端密钥未配置"), { status: 424 });
  return key;
}
