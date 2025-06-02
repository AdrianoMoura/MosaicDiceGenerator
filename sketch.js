let canvas

let imgCanvas = null
let imgOriginalCanvas = null
let imgMatrix = []
let squareSize = null
let shouldUpdate = false
let invertColors = false

// Variables for zoom and pan
let zoom = 1
let panX = 0
let panY = 0
let isDragging = false
let lastMouseX, lastMouseY

// p5.js setup function: initializes the canvas
function setup () {
  const canvasWidth = windowWidth - 640
  const canvasHeight = windowHeight
  canvas = createCanvas(canvasWidth, canvasHeight)
  canvas.parent('canvas-holder')
  background(18)
}

// p5.js draw loop: draws the dice mosaic and handles updates
function draw () {
  background(18)

  // If a new image or parameter was set, process the image
  if (imgOriginalCanvas && shouldUpdate) {
    processImage()
    shouldUpdate = false
  }

  // If no image matrix, nothing to draw
  if (imgMatrix.length === 0) return

  // Apply pan and zoom transforms
  translate(panX, panY)
  scale(zoom)
  drawImage()
}

// Checks if the mouse is inside the canvas area
function mouseInsideCanvas () {
  const bounds = canvas.elt.getBoundingClientRect()
  const x = window.event?.clientX
  const y = window.event?.clientY

  return (
    x >= bounds.left &&
    x <= bounds.right &&
    y >= bounds.top &&
    y <= bounds.bottom
  )
}

// Handles mouse wheel for zooming in/out
function mouseWheel (event) {
  if (!mouseInsideCanvas()) return

  const zoomFactor = 1.05
  const oldZoom = zoom

  if (event.delta > 0) {
    zoom /= zoomFactor
  } else {
    zoom *= zoomFactor
  }
  zoom = constrain(zoom, 0.2, 10)

  // Adjust pan so zoom is centered on mouse position
  const wx = (mouseX - panX) / oldZoom
  const wy = (mouseY - panY) / oldZoom

  panX = mouseX - wx * zoom
  panY = mouseY - wy * zoom

  return false
}

// Handles mouse press for starting pan
function mousePressed () {
  if (!mouseInsideCanvas()) return
  isDragging = true
  lastMouseX = mouseX
  lastMouseY = mouseY
}

// Handles mouse release to stop panning
function mouseReleased () {
  isDragging = false
}

// Handles mouse drag for panning the canvas
function mouseDragged () {
  if (!isDragging || !mouseInsideCanvas()) return
  panX += mouseX - lastMouseX
  panY += mouseY - lastMouseY
  lastMouseX = mouseX
  lastMouseY = mouseY
}

// Processes the loaded image and generates the grayscale matrix for dice
function processImage () {
  imgCanvas = imgOriginalCanvas.get()
  invertColors = invertColorInput.checked

  imgMatrix = []

  const w = parseInt(outputWidthInput.value)
  const h = parseInt(outputHeightInput.value)
  if (!w || !h) return

  imgCanvas.resize(w, h)
  imgCanvas.loadPixels()

  const contrast = parseFloat(contrastSlider.value) || 1

  let pixelsArray = []
  let minGray = 255
  let maxGray = 0

  // Step 1: Convert to grayscale and track min/max values
  for (let i = 0; i < imgCanvas.pixels.length; i += 4) {
    const r = imgCanvas.pixels[i]
    const g = imgCanvas.pixels[i + 1]
    const b = imgCanvas.pixels[i + 2]
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b

    pixelsArray.push(gray)
    minGray = Math.min(minGray, gray)
    maxGray = Math.max(maxGray, gray)
  }

  // Step 2: Normalize and apply contrast
  for (let i = 0; i < pixelsArray.length; i++) {
    let norm = (pixelsArray[i] - minGray) / (maxGray - minGray)
    norm = constrain(norm, 0, 1)
    let contrasted = 128 + (norm - 0.5) * 255 * contrast
    imgMatrix.push(constrain(contrasted, 0, 255))
  }

  // Calculate square size for dice based on available canvas space
  const padding = 40
  const maxSquareW = (width - padding * 2) / imgCanvas.width
  const maxSquareH = (height - padding * 2) / imgCanvas.height
  squareSize = Math.max(Math.min(maxSquareW, maxSquareH), 1)
}

// Draws the dice mosaic on the canvas
function drawImage () {
  if (!imgMatrix || imgMatrix.length === 0) return

  const offsetX = (width - imgCanvas.width * squareSize) / 2
  const offsetY = (height - imgCanvas.height * squareSize) / 2

  const invisibleDice = squareSize <= 1

  // Draw each die if visible
  if (!invisibleDice) {
    for (let y = 0; y < imgCanvas.height; y++) {
      for (let x = 0; x < imgCanvas.width; x++) {
        const index = y * imgCanvas.width + x
        const value = imgMatrix[index]

        const px = x * squareSize + offsetX
        const py = y * squareSize + offsetY

        drawDieFace(px, py, squareSize, value)
      }
    }
  }

  // If dice are too small, show a warning message
  if (invisibleDice) {
    zoom = 1
    panX = 0
    panY = 0
    fill(255)
    textAlign(CENTER, CENTER)
    textSize(20)
    text(
      'Preview disabled due to high dice count.\nYou can still export the image or TXT.',
      width / 2,
      height /2
    )
  }
}

// Draws a single die face at (x, y) with a given grayscale value
function drawDieFace (x, y, size, avg) {
  const value = grayscaleToDiceLevel(avg)

  fill(invertColors ? 0 : 255)
  stroke(invertColors ? 255 : 0)
  strokeWeight(0)
  rect(x, y, size, size, size * 0.2)

  // Calculate pip positions
  const cx = x + size / 2
  const cy = y + size / 2
  const offset = size * 0.25
  const pipSize = size * 0.2

  noStroke()
  fill(invertColors ? 255 : 0) // black pips

  const drawPip = (px, py) => ellipse(px, py, pipSize, pipSize)

  const left = x + offset
  const right = x + size - offset
  const top = y + offset
  const bottom = y + size - offset

  const center = [cx, cy]
  const tl = [left, top]
  const tr = [right, top]
  const bl = [left, bottom]
  const br = [right, bottom]
  const ml = [left, cy]
  const mr = [right, cy]

  // Draw pips according to dice value
  if ([1, 3, 5].includes(value)) drawPip(...center)
  if (value >= 2) {
    drawPip(...tl)
    drawPip(...br)
  }
  if (value >= 4) {
    drawPip(...tr)
    drawPip(...bl)
  }
  if (value === 6) {
    drawPip(...ml)
    drawPip(...mr)
  }
}

// Converts grayscale value to dice level (1-6)
function grayscaleToDiceLevel (avg) {
  if (invertColors) {
    avg = 255 - avg
  }

  if (avg >= 213) return 1
  if (avg >= 170) return 2
  if (avg >= 128) return 3
  if (avg >= 85) return 4
  if (avg >= 43) return 5
  return 6
}

// Renders the dice mosaic to an off-screen buffer for export
function renderToImageBuffer (cols, rows, tileSize, matrix) {
  const buffer = createGraphics(cols * tileSize, rows * tileSize)

  buffer.background(255)
  buffer.noStroke()
  buffer.rectMode(CORNER)
  buffer.ellipseMode(CENTER)
  buffer.textAlign(CENTER, CENTER)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const value = grayscaleToDiceLevel(matrix[y * cols + x])
      const px = x * tileSize
      const py = y * tileSize

      drawDieFaceToBuffer(buffer, px, py, tileSize, value)
    }
  }

  return buffer
}

// Draws a single die face to a p5.Graphics buffer (used for export)
function drawDieFaceToBuffer (gfx, x, y, size, value) {
  gfx.fill(invertColors ? 0 : 255)
  gfx.stroke(invertColors ? 255 : 0)
  gfx.strokeWeight(0)
  gfx.rect(x, y, size, size, size * 0.2)

  const cx = x + size / 2
  const cy = y + size / 2
  const offset = size * 0.25
  const pipSize = size * 0.2

  gfx.noStroke()
  gfx.fill(invertColors ? 255 : 0)

  const drawPip = (px, py) => gfx.ellipse(px, py, pipSize, pipSize)

  const left = x + offset
  const right = x + size - offset
  const top = y + offset
  const bottom = y + size - offset

  const center = [cx, cy]
  const tl = [left, top]
  const tr = [right, top]
  const bl = [left, bottom]
  const br = [right, bottom]
  const ml = [left, cy]
  const mr = [right, cy]

  // Draw pips according to dice value
  if ([1, 3, 5].includes(value)) drawPip(...center)
  if (value >= 2) {
    drawPip(...tl)
    drawPip(...br)
  }
  if (value >= 4) {
    drawPip(...tr)
    drawPip(...bl)
  }
  if (value === 6) {
    drawPip(...ml)
    drawPip(...mr)
  }
}
