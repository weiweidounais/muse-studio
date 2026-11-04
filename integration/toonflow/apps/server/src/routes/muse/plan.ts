import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({ directory: z.string().min(1).max(4096), kind: z.enum(["brief", "storyboard"]), prompt: z.string().trim().min(1).max(6000), characters: z.string().max(2000).default("") }), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const result = await u.muse.createPlan(directory, req.body.kind, req.body.prompt.trim(), req.body.characters ?? "");
  res.json(success(result));
});
