# 🎲 Dice Mosaic Generator

This project transforms an uploaded image into a mosaic composed of dice, where each die face represents the brightness level of a pixel region. It's designed for visualization, planning real-world dice mosaics, and exporting vector graphics (SVG) or reference text.

## ✨ Features

- Upload an image and convert it into a dice mosaic
- Adjustable:
  - Dice size (mm)
  - Output dimensions (in dice or cm)
  - Contrast
  - Inverted colors (for black dices)
- Live preview
- Export as:
  - PNG image
  - SVG file with vector-rendered dice
  - TXT reference file (matrix of dice values)
- Calculates total number of dice and estimated price
- Zoom and pan support for preview canvas

## 🧩 How It Works

1. The uploaded image is resized to the target width/height in number of dice.
2. Each pixel block is converted to grayscale.
3. The grayscale is normalized and contrast is applied.
4. Each region is mapped to a die face (1–6), based on brightness.
5. The preview is rendered using p5.js on canvas.
6. Export options generate static outputs based on the matrix.

## 🔧 Usage

1. Access it here.
2. Upload an image.
3. Set the desired output size and dice size.
4. Optionally adjust contrast or invert colors.
5. Export using one of the available buttons:
   - **Export Image (PNG)**: Bitmap rendering for quick previews.
   - **Export SVG**: High-resolution, scalable vector in real size.
   - **Export TXT**: Plain text matrix with all dice values.

## ⚙️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Rendering**: [p5.js](https://p5js.org/)
- **Vector Export**: Native SVG DOM manipulation

## 📦 Output Examples

- `your_image_80x60_normal.svg` – SVG mosaic, 80 dice wide by 60 high.
- `your_image_80x60_inverted.txt` – Inverted colors, raw dice values for reference.
- `your_image_80x60_normal.png` – PNG snapshot of the dice mosaic.

## 📏 Dice Level Mapping

| Grayscale Range | Dice Face |
|------------------|------------|
| 213–255          | 🎲 1       |
| 170–212          | 🎲 2       |
| 128–169          | 🎲 3       |
| 85–127           | 🎲 4       |
| 43–84            | 🎲 5       |
| 0–42             | 🎲 6       |

## 🧠 Notes

- The preview may be unavailable if the dice are too small to render, but you still can get the SVG or Text file.
- SVG export uses actual dice dimensions in millimeters.
- Performance may degrade for large images.

## 📜 License

MIT License © 2025

