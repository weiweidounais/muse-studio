import type { ExtDefinition } from "@toonflow/ext-scaffold/runtime";
export default {
  id: "ext-museStudio", displayName: "MUSE 创作工作台", extensions: ["musestudio"], resourceKind: "file", text: true,
  icon: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#ceee92"/><path d="M12 3v18M3 12h18M6 6l12 12M6 18 18 6" stroke="#263322" stroke-width="1.5"/></svg>'),
} satisfies Omit<ExtDefinition, "load">;
