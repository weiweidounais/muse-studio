import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const schema = z.object({ directory: z.string().min(1).max(4096), ratio: z.enum(["16:9", "9:16"]), frames: z.array(z.object({ path: z.string().min(1).max(2048), duration: z.number().int().min(1).max(10) })).min(1).max(8) });
export default Router().post("/", validateFields(schema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = schema.parse(req.body);
  const directory = await u.workspace.resolveWorkspace(req, input.directory);
  res.status(202).json(success(await u.muse.exportVideo(directory, input)));
});
