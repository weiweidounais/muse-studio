<template>
  <section class="museStudio">
    <header class="studioHeader"><div><span class="brandMark">✳</span><strong>MUSE Studio</strong><span class="runtimeTag">Toonflow × Fabric.js</span></div><div class="headerActions"><span :class="['serviceTag', serviceReady ? 'ready' : '']">{{ serviceReady ? 'DeepSeek 已配置' : 'DeepSeek 未配置' }}</span><button @click="saveNow">{{ context.dirty ? '保存项目' : '已保存' }}</button></div></header>
    <div v-if="error || context.error" class="errorBox" role="alert">{{ error || context.error }}<button @click="error = ''">关闭</button></div>
    <div class="modeTabs"><button :class="{ active: mode === 'commerce' }" @click="mode = 'commerce'">电商素材</button><button :class="{ active: mode === 'story' }" @click="mode = 'story'">短剧分镜</button><span>真实编辑与服务端保存 · 模型生成需要独立服务配置</span></div>
    <div v-if="mode === 'commerce'" class="commerceGrid">
      <aside class="settingsPanel"><p class="eyebrow">IMAGE WORKSPACE</p><h2>把商品，变成创意。</h2><label for="museBrief">创作要求</label><textarea id="museBrief" v-model="documentState.brief" @input="saveText" />
        <button class="primaryButton" :disabled="busy || !serviceReady" @click="createPlan('brief')">{{ busy ? '正在请求…' : 'DeepSeek 生成创意方案' }}</button><p class="hint">真实线上调用，最多 2400 输出 tokens；模型输出通过结构校验后保存。</p>
        <div v-if="documentState.briefResult" class="planCard"><h3>{{ documentState.briefResult.headline }}</h3><p>{{ documentState.briefResult.prompt }}</p><button @click="applyHeadline">应用标题到画布</button></div>
        <label>画布尺寸</label><select v-model="documentState.ratio" @change="resizeBoard"><option value="1:1">1:1 · 1080×1080</option><option value="3:4">3:4 · 1080×1440</option><option value="9:16">9:16 · 1080×1920</option></select>
        <div class="buttonRow"><button @click="chooseUpload('product')">上传商品图</button><button @click="chooseUpload('background')">上传背景</button></div><p class="hint">建议使用透明底商品图；演示场景图不是抠图结果。文件存入本项目。</p>
        <div class="buttonRow"><button @click="addText">添加文字</button><button @click="toggleLock">锁定／解锁选中层</button></div><button @click="removeSelected">移除选中图层</button><p class="hint">只改变画布引用，不删除项目素材。</p>
        <label for="museText">选中文字</label><textarea id="museText" v-model="selectedText" @input="editText" placeholder="选中一个文字图层后编辑" />
        <div class="buttonRow"><label>颜色<input v-model="selectedColor" type="color" @input="editColor" /></label><label>字号<input v-model.number="selectedSize" type="number" min="16" max="180" @change="editSize" /></label></div>
      </aside>
      <main class="boardPanel"><div class="boardToolbar"><span>对象画布 · 拖动／缩放／双击编辑文字</span><div><button @click="undo">撤销</button><button class="primaryButton" @click="exportPng">导出 PNG</button></div></div><div class="boardStage"><div class="boardFrame" :style="{ aspectRatio: ratioValue }"><canvas ref="canvasElement" aria-label="商品海报编辑画布" /></div></div><p class="hint boardHint">商品、背景、文字为独立对象；同一 Fabric 画布用于编辑和导出。</p></main>
    </div>
    <div v-else class="storyPanel"><div class="storySettings"><p class="eyebrow">STORY WORKSPACE</p><h2>让故事，拥有自己的镜头。</h2><label for="museStory">故事梗概</label><textarea id="museStory" v-model="documentState.story" @input="saveText" /><label for="museCharacters">共享角色设定</label><textarea id="museCharacters" v-model="documentState.characters" @input="saveText" />
        <button class="primaryButton" :disabled="busy || !serviceReady" @click="createPlan('storyboard')">{{ busy ? '正在请求…' : 'DeepSeek 生成四镜头脚本' }}</button><p class="hint">先审阅脚本，再确认视觉制作。角色或剧情修改后须重新确认。</p>
        <template v-if="documentState.storyResult"><button :disabled="busy || confirmed" @click="confirmStory">{{ confirmed ? '✓ 当前脚本已确认' : '确认当前角色与分镜' }}</button><button :disabled="!confirmed" @click="createWorkflow">建立 Toonflow 镜头工作流</button></template>
        <label>视频比例</label><select v-model="documentState.videoRatio" @change="saveText"><option value="16:9">16:9 横屏</option><option value="9:16">9:16 竖屏</option></select>
        <button class="primaryButton" :disabled="!confirmed || exporting || !allFrames" @click="exportVideo">{{ exporting ? '后台编码中…' : 'FFmpeg 导出静帧 MP4' }}</button><p class="hint">将四张图片按镜头顺序编码成视频，不是 AI 动态视频；真实图生视频请在 Toonflow 节点配置服务。</p>
        <div v-if="documentState.exportJob" class="jobCard"><strong>导出任务：{{ documentState.exportJob.state }}</strong><p v-if="documentState.exportJob.error">{{ documentState.exportJob.error }}</p><button v-if="documentState.exportJob.state === 'completed'" @click="downloadVideo">下载 MP4</button><p class="hint">任务记录持久化，关闭文档后仍可查看。</p></div>
      </div>
      <div class="shotsPanel"><div class="storySummary"><h2>{{ documentState.storyResult?.title || '等待生成真实分镜脚本' }}</h2><p>{{ documentState.storyResult?.characters || '尚未生成。这里不展示模拟剧情。' }}</p></div><div class="shotGrid"><article v-for="(shot, index) in documentState.storyResult?.shots || []" :key="index" class="shotCard"><div class="shotImage"><img v-if="frameUrls[index]" :src="frameUrls[index]" :alt="shot.name" /><span v-else>镜头 {{ index + 1 }} · 等待素材</span><button @click="chooseUpload('frame', index)">上传／替换分镜图</button></div><div class="shotBody"><div class="shotHeading"><strong>0{{ index + 1 }} · {{ shot.name }}</strong><span>{{ shot.duration }}s</span></div><p>{{ shot.camera }}</p><textarea v-model="shot.description" aria-label="镜头描述" @input="saveText" /><details><summary>画面要求</summary><p>{{ shot.imagePrompt }}</p></details></div></article></div></div>
    </div>
    <input ref="uploadElement" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="uploadImage" />
    <footer><span>{{ notice || '项目内容保存在 Toonflow 服务端工作区；画布与分镜可继续编辑。' }}</span><span>模型状态与实际结果分别记录</span></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { Canvas, FabricImage, Textbox, Rect, type FabricObject } from "fabric";
import type { ExtContext } from "@toonflow/ext-scaffold/runtime";

type Shot = { name: string; description: string; camera: string; duration: number; imagePrompt: string; dialogue?: string; frame?: string };
type Story = { title: string; characters: string; shots: Shot[] };
type MuseDocument = { museStudio: true; version: 1; ratio: "1:1" | "3:4" | "9:16"; videoRatio: "16:9" | "9:16"; brief: string; story: string; characters: string; canvas?: Record<string, unknown>; briefResult?: { headline: string; prompt: string; notes: string[] }; storyResult?: Story; confirmedSignature?: string; planRecords?: string[]; exportJob?: { id: string; state: string; output?: string; error?: string } };
const props = defineProps<{ context: ExtContext }>();
const fresh = (): MuseDocument => ({ museStudio: true, version: 1, ratio: "1:1", videoRatio: "16:9", brief: "制作植物精华液春日上新素材，保留商品包装和标签，留出标题区域，不添加未经确认的功效。", story: "一个雨夜，林夏在旧书店收到一封来自过去的信，她重新找到生活的勇气。", characters: "林夏，28岁，米色风衣，黑色齐肩发；所有镜头保持同一角色和服装。" });
const documentState = ref<MuseDocument>(fresh());
const mode = ref("commerce"), error = ref(""), notice = ref(""), busy = ref(false), serviceReady = ref(false), exporting = ref(false);
const canvasElement = ref<HTMLCanvasElement>(), uploadElement = ref<HTMLInputElement>();
const board = shallowRef<Canvas>();
const selectedText = ref(""), selectedColor = ref("#243628"), selectedSize = ref(88);
const frameUrls = ref<Record<number, string>>({});
let validDocument = false, disposed = false;
let applying = false, lastText = "", uploadRole = "product", uploadFrame = 0, saveTimer: ReturnType<typeof setTimeout> | undefined, pollTimer: ReturnType<typeof setTimeout> | undefined;
const urls: ReturnType<ExtContext["files"]["acquireUrl"]>[] = [];
const history: string[] = [];
const dimensions = computed(() => documentState.value.ratio === "3:4" ? [1080, 1440] : documentState.value.ratio === "9:16" ? [1080, 1920] : [1080, 1080]);
const ratioValue = computed(() => documentState.value.ratio.replace(":", " / "));
const signature = computed(() => JSON.stringify([documentState.value.story, documentState.value.characters, documentState.value.storyResult]));
const confirmed = computed(() => !!documentState.value.storyResult && documentState.value.confirmedSignature === signature.value);
const allFrames = computed(() => documentState.value.storyResult?.shots.length === 4 && documentState.value.storyResult.shots.every(shot => !!shot.frame));
function showError(reason: unknown) { error.value = reason instanceof Error ? reason.message : "操作失败，请重试"; }
async function api<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`/api/muse/${path}`, { method: payload ? "POST" : "GET", headers: { "x-toonflow-workspace": "1", ...(payload ? { "Content-Type": "application/json" } : {}) }, ...(payload ? { body: JSON.stringify(payload) } : {}) });
  const result = await response.json() as { code: number; message?: string; data: T };
  if (!response.ok || result.code !== 200) throw new Error(result.message || `服务请求失败（${response.status}）`);
  return result.data;
}
function saveText() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { void saveNow(); }, 350); }
function captureCanvas() {
  if (!board.value || applying) return;
  const json = board.value.toObject(["data"]) as Record<string, unknown> & { objects: (Record<string, unknown> & { data?: { assetPath?: string } })[] };
  for (const object of json.objects) if (object.data?.assetPath) object.src = object.data.assetPath;
  documentState.value.canvas = json;
}
async function saveNow() {
  try { if (!validDocument) throw new Error("项目文件尚未正确加载，未覆盖原文件"); captureCanvas(); lastText = JSON.stringify(documentState.value, null, 2); props.context.updateText(lastText); await props.context.flushSave(); notice.value = "已保存到服务端项目"; return true; }
  catch (reason) { showError(reason); return false; }
}
function rememberCanvas() { if (board.value && !applying) { history.push(JSON.stringify(documentState.value.canvas ?? {})); if (history.length > 20) history.shift(); } }
function onCanvasChange() { if (applying) return; rememberCanvas(); captureCanvas(); saveText(); }
function selectObject() { const selected = board.value?.getActiveObject(); selectedText.value = selected instanceof Textbox ? selected.text : ""; selectedSize.value = selected instanceof Textbox ? selected.fontSize : 88; selectedColor.value = typeof selected?.fill === "string" ? selected.fill : "#243628"; }
async function loadCanvas() {
  if (!board.value) return;
  applying = true;
  try {
    board.value.setDimensions({ width: dimensions.value[0], height: dimensions.value[1] });
    if (documentState.value.canvas) {
      const json = JSON.parse(JSON.stringify(documentState.value.canvas)) as { objects?: (Record<string, unknown> & { data?: { assetPath?: string } })[] };
      json.objects = (json.objects ?? []).filter(object => ["image", "textbox", "rect"].includes(String(object.type).toLowerCase()));
      for (const object of json.objects) if (String(object.type).toLowerCase() === "image") {
        const path = object.data?.assetPath;
        if (!path || !/^museAssets\/[a-zA-Z0-9.-]+$/.test(path)) throw new Error("画布图片必须引用本项目的 museAssets 素材");
        const shared = props.context.files.acquireUrl(path); urls.push(shared); object.src = await shared.url;
      }
      await board.value.loadFromJSON(json);
      for (const object of board.value.getObjects()) {
        const role = (object.get("data") as { role?: string })?.role;
        if (role === "base") object.set({ width: dimensions.value[0], height: dimensions.value[1] });
        if (role === "background" && object instanceof FabricImage) {
          object.scale(Math.max(dimensions.value[0] / object.width, dimensions.value[1] / object.height));
          object.set({ originX: "left", originY: "top", left: (dimensions.value[0] - object.getScaledWidth()) / 2, top: (dimensions.value[1] - object.getScaledHeight()) / 2 });
        }
      }
    } else {
      board.value.clear();
      const background = new Rect({ originX: "left", originY: "top", left: 0, top: 0, width: dimensions.value[0], height: dimensions.value[1], fill: "#e9e6da", selectable: false, evented: false }); background.set("data", { role: "base" });
      board.value.add(background, new Textbox("让自然，\n唤醒每一天", { originX: "left", originY: "top", left: 86, top: 110, width: 900, fontSize: 88, splitByGrapheme: true, fontFamily: "sans-serif", fill: "#243628" }));
    }
    board.value.requestRenderAll();
  } finally { applying = false; }
}
function addText() { const text = new Textbox("编辑你的标题", { originX: "left", originY: "top", left: 85, top: 160, width: 850, fontSize: 88, splitByGrapheme: true, fill: "#243628" }); board.value?.add(text); board.value?.setActiveObject(text); onCanvasChange(); }
function editText() { const object = board.value?.getActiveObject(); if (object instanceof Textbox) { object.set("text", selectedText.value); board.value?.requestRenderAll(); onCanvasChange(); } }
function editColor() { const object = board.value?.getActiveObject(); if (object) { object.set("fill", selectedColor.value); board.value?.requestRenderAll(); onCanvasChange(); } }
function editSize() { const object = board.value?.getActiveObject(); if (object instanceof Textbox) { object.set("fontSize", Math.max(16, Math.min(180, selectedSize.value))); board.value?.requestRenderAll(); onCanvasChange(); } }
function removeSelected() { const selected = board.value?.getActiveObjects() ?? []; for (const object of selected) if ((object.get("data") as { role?: string })?.role !== "base") board.value?.remove(object); board.value?.discardActiveObject(); onCanvasChange(); }
function toggleLock() { const object = board.value?.getActiveObject(); if (object) { object.set({ lockMovementX: !object.lockMovementX, lockMovementY: !object.lockMovementY, lockScalingX: !object.lockScalingX, lockScalingY: !object.lockScalingY }); onCanvasChange(); } }
async function undo() { const previous = history.pop(); if (!previous) return; try { documentState.value.canvas = JSON.parse(previous); await loadCanvas(); await saveNow(); } catch (reason) { showError(reason); } }
async function resizeBoard() { try { captureCanvas(); await loadCanvas(); await saveNow(); } catch (reason) { showError(reason); } }
function chooseUpload(role: string, index = 0) { uploadRole = role; uploadFrame = index; uploadElement.value?.click(); }
async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement, file = input.files?.[0]; input.value = ""; if (!file) return;
  try {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error("请选择不超过 8MB 的 PNG、JPEG、WebP 图片");
    const bitmap = await createImageBitmap(file); bitmap.close();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `museAssets/${crypto.randomUUID()}.${extension}`;
    if (!(await props.context.files.list()).entries.some(entry => entry.name === "museAssets")) await props.context.files.mkdir("museAssets");
    await props.context.files.write(path, file, true);
    const shared = props.context.files.acquireUrl(path); urls.push(shared); const url = await shared.url;
    if (uploadRole === "frame") { const shot = documentState.value.storyResult?.shots[uploadFrame]; if (shot) { shot.frame = path; frameUrls.value[uploadFrame] = url; } }
    else if (board.value) {
      const image = await FabricImage.fromURL(url); image.set({ originX: "left", originY: "top" }); image.set("data", { assetPath: path, role: uploadRole });
      if (uploadRole === "background") { image.scale(Math.max(dimensions.value[0] / image.width, dimensions.value[1] / image.height)); image.set({ left: (dimensions.value[0] - image.getScaledWidth()) / 2, top: (dimensions.value[1] - image.getScaledHeight()) / 2 }); board.value.add(image); board.value.moveObjectTo(image, 1); }
      else { image.scaleToWidth(520); image.set({ left: (dimensions.value[0] - image.getScaledWidth()) / 2, top: dimensions.value[1] * .4 }); board.value.add(image); }
      board.value.setActiveObject(image); board.value.requestRenderAll();
    }
    await saveNow();
  } catch (reason) { showError(reason); }
}
function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob), link = globalThis.document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); }
async function exportPng() { try { if (!board.value) return; board.value.discardActiveObject(); const blob = await (await fetch(board.value.toDataURL({ format: "png", multiplier: 1 }))).blob(); downloadBlob(blob, `MUSE-${dimensions.value.join("x")}.png`); await saveNow(); } catch (reason) { showError(reason); } }
async function createPlan(kind: "brief" | "storyboard") {
  if (busy.value) return;
  const prompt = kind === "brief" ? documentState.value.brief : documentState.value.story;
  const characters = kind === "storyboard" ? documentState.value.characters : "";
  if (!prompt.trim()) { error.value = "请先填写创作要求"; return; }
  busy.value = true; error.value = "";
  try {
    if (!await saveNow()) return;
    const response = await api<{ result: MuseDocument["briefResult"] | Story; artifactPath: string }>("plan", { directory: props.context.resource.directory, kind, prompt, characters });
    if (disposed) return;
    if ((kind === "brief" ? documentState.value.brief : documentState.value.story) !== prompt || (kind === "storyboard" && documentState.value.characters !== characters)) { notice.value = `输入已变化，旧结果已保存在 ${response.artifactPath}，未覆盖当前计划`; return; }
    if (kind === "brief") documentState.value.briefResult = response.result as MuseDocument["briefResult"];
    else { documentState.value.storyResult = response.result as Story; documentState.value.confirmedSignature = ""; frameUrls.value = {}; }
    documentState.value.planRecords = [...(documentState.value.planRecords ?? []), response.artifactPath];
    await saveNow(); notice.value = "DeepSeek 真实结果已通过结构校验并保存";
  } catch (reason) { showError(reason); } finally { busy.value = false; }
}
function applyHeadline() { const title = board.value?.getObjects().find(object => object instanceof Textbox); if (title instanceof Textbox && documentState.value.briefResult) { title.set("text", documentState.value.briefResult.headline); board.value?.requestRenderAll(); onCanvasChange(); } }
async function confirmStory() { documentState.value.confirmedSignature = signature.value; await saveNow(); }
async function createWorkflow() {
  if (!confirmed.value || !documentState.value.storyResult) return;
  try {
    const nodes: Record<string, unknown>[] = [], edges: Record<string, unknown>[] = [];
    documentState.value.storyResult.shots.forEach((shot, index) => {
      const imageId = crypto.randomUUID(), videoId = crypto.randomUUID();
      nodes.push({ id: imageId, type: "remote-imageGenerationNode", position: { x: index * 680, y: 0 }, data: { label: `镜头 ${index + 1} · ${shot.name}`, prompt: `${documentState.value.characters}\n${shot.imagePrompt}`, ratio: documentState.value.videoRatio, promptModel: [], model: "", size: "", other: {} } });
      nodes.push({ id: videoId, type: "remote-videoGenerationNode", position: { x: index * 680, y: 620 }, data: { label: `视频 ${index + 1}`, prompt: `${shot.camera}。${shot.description}`, promptModel: [], ratio: documentState.value.videoRatio, model: "", other: {} } });
      edges.push({ id: crypto.randomUUID(), source: imageId, sourceHandle: "image", target: videoId, targetHandle: "in" });
    });
    const path = `museStoryboard${Date.now()}.json`;
    await props.context.files.writeJson(path, { toonflowCanvas: true, nodes, edges, viewport: { x: 80, y: 80, zoom: .45 } }, true);
    notice.value = `已保存 ${path}；切换到「画布」，在画布菜单选择该文件，再配置图像／视频模型。`;
  } catch (reason) { showError(reason); }
}
async function exportVideo() {
  if (!confirmed.value || !allFrames.value || exporting.value) return;
  exporting.value = true;
  try { const job = await api<{ id: string; state: string }>("export", { directory: props.context.resource.directory, ratio: documentState.value.videoRatio, frames: documentState.value.storyResult!.shots.map(shot => ({ path: shot.frame, duration: shot.duration })) }); documentState.value.exportJob = job; await saveNow(); await pollExport(); }
  catch (reason) { exporting.value = false; showError(reason); }
}
async function pollExport() {
  const job = documentState.value.exportJob; if (!job) return;
  try { documentState.value.exportJob = await api(`job?directory=${encodeURIComponent(props.context.resource.directory)}&id=${encodeURIComponent(job.id)}`); exporting.value = documentState.value.exportJob?.state === "running"; await saveNow(); if (exporting.value) pollTimer = setTimeout(() => { void pollExport(); }, 1500); }
  catch (reason) { exporting.value = false; showError(reason); }
}
async function downloadVideo() { try { const path = documentState.value.exportJob?.output; if (!path) return; downloadBlob(new Blob([await props.context.files.read(path)], { type: "video/mp4" }), "MUSE-分镜静帧视频.mp4"); } catch (reason) { showError(reason); } }
async function refreshFrames() { frameUrls.value = {}; for (const [index, shot] of (documentState.value.storyResult?.shots ?? []).entries()) if (shot.frame) { const shared = props.context.files.acquireUrl(shot.frame); urls.push(shared); frameUrls.value[index] = await shared.url; } }
watch(() => props.context.text, async text => {
  if (text === lastText || props.context.loading || !text.trim()) return;
  try { const parsed = JSON.parse(text); if (parsed?.museStudio !== true || parsed.version !== 1 || !["1:1", "3:4", "9:16"].includes(parsed.ratio) || (parsed.canvas?.objects?.length ?? 0) > 300) throw new Error("不是有效的 MUSE 项目文件"); documentState.value = { ...fresh(), ...parsed }; validDocument = true; error.value = ""; lastText = text; await nextTick(); await loadCanvas(); await refreshFrames(); if (documentState.value.exportJob?.state === "running") await pollExport(); }
  catch (reason) { showError(reason); }
}, { immediate: true });
watch(mode, async () => { await nextTick(); if (mode.value === "commerce" && canvasElement.value) { if (board.value) await board.value.dispose(); setupCanvas(); await loadCanvas(); } });
function setupCanvas() { if (!canvasElement.value) return; board.value = new Canvas(canvasElement.value, { width: dimensions.value[0], height: dimensions.value[1], preserveObjectStacking: true }); board.value.on("object:modified", onCanvasChange); board.value.on("text:changed", onCanvasChange); board.value.on("selection:created", selectObject); board.value.on("selection:updated", selectObject); board.value.on("selection:cleared", selectObject); }
onMounted(async () => { try { setupCanvas(); await loadCanvas(); const result = await api<{ configured: boolean }>("status"); serviceReady.value = result.configured; } catch (reason) { showError(reason); } });
onBeforeUnmount(() => { disposed = true; clearTimeout(saveTimer); clearTimeout(pollTimer); if (validDocument) { captureCanvas(); props.context.updateText(JSON.stringify(documentState.value, null, 2)); } for (const shared of urls) shared.release(); void board.value?.dispose(); });
</script>

<style scoped lang="scss">
.museStudio { height: 100%; overflow: auto; color: #e8e9ec; background: #17191d; font: 13px system-ui, sans-serif;
  button, input, textarea, select { font: inherit; } button { cursor: pointer; border: 1px solid #41464d; border-radius: 7px; background: #2c3035; color: #e6e8eb; padding: 9px 12px; } button:disabled { opacity: .4; cursor: default; } button:focus-visible { outline: 2px solid #ceee92; } .primaryButton { background: #ceee92; color: #26331e; border-color: #ceee92; }
  .studioHeader { display: flex; justify-content: space-between; align-items: center; gap: 14px; padding: 18px 24px; border-bottom: 1px solid #34383e; > div { display: flex; align-items: center; gap: 10px; } strong { font-size: 22px; } .brandMark { color: #ceee92; font-size: 29px; } .runtimeTag { font-size: 10px; color: #a7acb4; } .serviceTag { font-size: 10px; color: #d3b078; } .ready { color: #ceee92; } }
  .modeTabs { display: flex; align-items: center; gap: 8px; padding: 15px 24px; .active { background: #38432c; color: #ceee92; } > span { margin-left: auto; color: #858c96; font-size: 10px; } }
  .commerceGrid { display: grid; grid-template-columns: 285px minmax(300px, 1fr); margin: 0 24px 20px; border: 1px solid #34383e; border-radius: 12px; overflow: hidden; }
  .settingsPanel, .storySettings { padding: 23px; background: #202328; h2 { font-size: 23px; margin: 10px 0 22px; font-weight: 500; } label { display: block; margin: 16px 0 7px; color: #b3bac5; font-size: 11px; } > button { width: 100%; margin: 6px 0; } }
  textarea, select, input[type="number"] { box-sizing: border-box; width: 100%; border: 1px solid #434951; background: #292e34; border-radius: 7px; color: #e2e6ed; padding: 10px; } textarea { min-height: 95px; line-height: 1.8; resize: vertical; } .eyebrow { color: #b6c99b; letter-spacing: 2px; font-size: 10px; } .hint { color: #929ba7; font-size: 10px; line-height: 1.8; } .buttonRow { display: flex; gap: 7px; margin-top: 10px; > * { flex: 1; min-width: 0; } }
  .boardPanel { min-width: 0; } .boardToolbar { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #34383e; font-size: 10px; color: #a4adb8; > div { display: flex; gap: 6px; } }
  .boardStage { display: flex; align-items: center; justify-content: center; padding: 38px; min-height: 530px; background: radial-gradient(#34383e 1px, transparent 1px) 0 0 / 17px 17px; } .boardFrame { width: min(100%, 530px); box-shadow: 0 18px 45px #0005; :deep(.canvas-container) { width: 100% !important; height: 100% !important; } :deep(canvas) { width: 100% !important; height: 100% !important; } } .boardHint { padding: 0 20px 14px; }
  .planCard, .jobCard { padding: 12px; border-radius: 7px; background: #2d3526; margin-top: 15px; line-height: 1.8; h3 { font-size: 14px; } p { font-size: 11px; color: #b6c1ac; } }
  .storyPanel { display: grid; grid-template-columns: 285px 1fr; margin: 0 24px 20px; gap: 20px; } .storySettings { border: 1px solid #34383e; border-radius: 10px; } .storySummary { padding: 12px 0 20px; h2 { font-size: 24px; margin: 0 0 10px; } p { color: #a3acb8; line-height: 1.8; } } .shotGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } .shotCard { background: #23272d; border: 1px solid #3c424a; border-radius: 9px; overflow: hidden; } .shotImage { aspect-ratio: 16 / 9; position: relative; background: #30363e; display: grid; place-items: center; img { width: 100%; height: 100%; object-fit: cover; position: absolute; } span { font-size: 12px; color: #8995a3; } button { position: absolute; bottom: 10px; right: 10px; font-size: 10px; background: #1b2026db; } } .shotBody { padding: 15px; p { color: #9ba7b5; font-size: 11px; } textarea { min-height: 85px; } details { font-size: 11px; color: #aab5c4; padding-top: 10px; line-height: 1.8; } } .shotHeading { display: flex; justify-content: space-between; gap: 10px; span { color: #ceee92; } }
  .errorBox { padding: 12px 24px; background: #4e2e31; color: #ffd0d0; display: flex; align-items: center; justify-content: space-between; gap: 10px; } footer { display: flex; justify-content: space-between; padding: 12px 24px; color: #85919d; font-size: 10px; border-top: 1px solid #34383e; }
  @media (max-width: 800px) { .commerceGrid, .storyPanel { display: flex; flex-direction: column; margin: 0 12px 15px; } .modeTabs { padding: 12px; > span { display: none; } } .studioHeader { padding: 12px; flex-wrap: wrap; .runtimeTag { display: none; } } .boardStage { min-height: 300px; padding: 18px; } .shotGrid { grid-template-columns: 1fr; } footer { flex-wrap: wrap; gap: 8px; } }
}
</style>
