export const palette = {
  paper:     "#f6f0e4",
  paperSub:  "#ece4d2",
  ink:       "#0a1224",
  inkSoft:   "#2d3a52",
  brass:     "#c8a047",
  brassDeep: "#9a7830",
  skyTop:    "#050816",
  skyBottom: "#0d1530",
  ambient:   "#1a2440",
  moon:      "#f0c674",
  groundDim: "#1a1410"
} as const;

export type PaletteKey = keyof typeof palette;
