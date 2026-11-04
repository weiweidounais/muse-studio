import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

export default Router().get("/", (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const configured = u.ai.listAiModels().some(model => model.providerId === "deepSeek" && model.modelId === "deepseek-flash");
  res.set("Cache-Control", "no-store").json(success({ product: "MUSE Studio", runtime: "Toonflow", configured, model: "deepseek-flash", mode: "live", mediaConfiguration: "/api/providers/media/list" }));
});
