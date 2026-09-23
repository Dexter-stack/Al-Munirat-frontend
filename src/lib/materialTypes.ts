import type { MaterialType } from "@/types/academic";

/** Maps each material type to a Material Symbols icon name. */
export const MATERIAL_TYPE_ICON: Record<MaterialType, string> = {
  pdf: "picture_as_pdf",
  video: "movie",
  audio: "audiotrack",
  document: "description",
  image: "image",
  text: "sticky_note_2",
};

export const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  pdf: "PDF",
  video: "Video",
  audio: "Audio",
  document: "Document",
  image: "Image",
  text: "Notes",
};

/** Types the browser can render inline via window.open rather than needing a forced download. */
export const VIEWABLE_MATERIAL_TYPES: MaterialType[] = ["pdf", "image", "video", "audio"];
