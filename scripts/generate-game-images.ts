/**
 * سكربت توليد أصول لعبة «ثقافتنا» (أمر تشغيلي لمرة واحدة)
 * يولّد 5 صور ثقافية للألغاز المصوّرة في public/images/game
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

const OUT_DIR = "/home/z/my-project/public/images/game";

const IMAGES: Array<{ file: string; prompt: string }> = [
  {
    file: "library.png",
    prompt:
      "Cozy vintage library interior, tall wooden bookshelves filled with old leather-bound books, arched windows with warm golden light, oriental rugs, cinematic warm atmosphere, professional photography, high quality, detailed",
  },
  {
    file: "calligraphy.png",
    prompt:
      "Elegant dip pen writing flowing black ink strokes on cream paper, close-up view, warm soft lighting, professional photography, high quality, detailed",
  },
  {
    file: "manuscript.png",
    prompt:
      "Old illuminated manuscript page with golden ornamental borders and elegant black script, aged parchment, museum artifact, professional photography, high quality, detailed",
  },
  {
    file: "reed-pen.png",
    prompt:
      "Traditional wooden dip pen resting on a vintage wooden desk beside a small brass inkwell, warm candlelight, professional photography, high quality, detailed",
  },
  {
    file: "inkwell.png",
    prompt:
      "Ornate engraved brass inkwell on an aged wooden table, vintage writing tools around, professional product photography, warm tones, high quality, detailed",
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const zai = await ZAI.create();

  for (const image of IMAGES) {
    const outPath = path.join(OUT_DIR, image.file);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10000) {
      console.log(`↷ موجود مسبقاً: ${image.file}`);
      continue;
    }
    process.stdout.write(`⚙ توليد: ${image.file} ... `);
    const response = await zai.images.generations.create({
      prompt: image.prompt,
      size: "1024x1024",
    });
    const base64 = response.data[0].base64;
    fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
    console.log(`تم (${Math.round(fs.statSync(outPath).size / 1024)}KB)`);
  }

  console.log("ALL_IMAGES_DONE");
}

main().catch((error) => {
  console.error("فشل التوليد:", error);
  process.exit(1);
});
