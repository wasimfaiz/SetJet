// src/lib/pdf-fonts.ts
import { Font } from "@react-pdf/renderer";

Font.register({
  family: "Times New Roman",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/times-new-roman@4.5.10/files/times-new-roman-latin-400-normal.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/times-new-roman@4.5.10/files/times-new-roman-latin-700-normal.ttf",
      fontWeight: 700,
    },
  ],
});


