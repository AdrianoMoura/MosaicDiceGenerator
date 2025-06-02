// Get references to DOM elements
const inputImage = document.getElementById('image-upload')
const diceSizeInput = document.getElementById('dice-size')

const outputWidthInput = document.getElementById('output-width')
const outputHeightInput = document.getElementById('output-height')
const outputWidthCmInput = document.getElementById('output-width-cm')
const outputHeightCmInput = document.getElementById('output-height-cm')
const totalDiceText = document.getElementById('total-dice')
const diceValueInput = document.getElementById('dice-value')
const totalPriceText = document.getElementById('total-price')
const invertColorInput = document.getElementById('invert-colors')
const exportButton = document.getElementById('export-button')
const exportTextButton = document.getElementById('export-text-button')
const contrastSlider = document.getElementById('contrast-slider')

let imgRef // Used to keep a reference to the loaded image for p5.js
let baseImageName = ''
let aspectRatio = null

// Helper functions for unit conversion
const toCm = (px, mm) => ((px * mm) / 10).toFixed(1)
const toPx = (cm, mm) => Math.round((cm * 10) / mm)

// Update output fields when width in dice changes
function updateFromDataWidth () {
  if (!aspectRatio) return
  const mm = parseFloat(diceSizeInput.value) || 16
  const w = parseInt(outputWidthInput.value)
  const h = Math.round(w / aspectRatio)

  shouldUpdate = true
  outputHeightInput.value = h
  outputWidthCmInput.value = toCm(w, mm)
  outputHeightCmInput.value = toCm(h, mm)
}

// Update output fields when height in dice changes
function updateFromDataHeight () {
  if (!aspectRatio) return
  const mm = parseFloat(diceSizeInput.value) || 16
  const h = parseInt(outputHeightInput.value)
  const w = Math.round(h * aspectRatio)

  shouldUpdate = true
  outputWidthInput.value = w
  outputWidthCmInput.value = toCm(w, mm)
  outputHeightCmInput.value = toCm(h, mm)
}

// Update output fields when width in centimeters changes
function updateFromCmWidth () {
  if (!aspectRatio) return
  const mm = parseFloat(diceSizeInput.value) || 16
  const cm = parseFloat(outputWidthCmInput.value)
  const w = toPx(cm, mm)
  const h = Math.round(w / aspectRatio)

  shouldUpdate = true
  outputWidthInput.value = w
  outputHeightInput.value = h
  outputHeightCmInput.value = toCm(h, mm)
}

// Update output fields when height in centimeters changes
function updateFromCmHeight () {
  if (!aspectRatio) return
  const mm = parseFloat(diceSizeInput.value) || 16
  const cm = parseFloat(outputHeightCmInput.value)
  const h = toPx(cm, mm)
  const w = Math.round(h * aspectRatio)

  shouldUpdate = true
  outputHeightInput.value = h
  outputWidthInput.value = w
  outputWidthCmInput.value = toCm(w, mm)
}

// Update centimeter fields when dice size changes
function updateFromDiceSize () {
  if (!aspectRatio) return
  const mm = parseFloat(diceSizeInput.value) || 16
  const w = parseInt(outputWidthInput.value)
  const h = parseInt(outputHeightInput.value)

  shouldUpdate = true
  outputWidthCmInput.value = toCm(w, mm)
  outputHeightCmInput.value = toCm(h, mm)
}

// Update the total number of dice and price
function updateTotalDice () {
  const w = parseInt(outputWidthInput.value)
  const h = parseInt(outputHeightInput.value)
  const v = parseFloat(diceValueInput.value)

  const totalDice = !w || !h ? 0 : w * h
  const totalPrice = !w || !h || isNaN(v) ? 0 : totalDice * v

  totalDiceText.textContent = `Number of Dice: ${totalDice.toLocaleString(
    'en-US'
  )}`
  totalPriceText.textContent = `Total price: $${totalPrice.toFixed(2)}`
}

// Handle image upload and initialize output fields
inputImage.addEventListener('change', e => {
  const file = e.target.files[0]
  if (!file) return

  baseImageName = file.name.replace(/\.[^/.]+$/, '')

  const img = new Image()
  img.onload = () => {
    const pixelWidth = img.naturalWidth
    const pixelHeight = img.naturalHeight
    aspectRatio = pixelWidth / pixelHeight
    const mm = parseFloat(diceSizeInput.value) || 16

    // Limit the physical size to 200 cm
    const maxCm = 200
    const dicePerCm = 10 / mm // 1 cm = 10 mm, so how many dice fit in 1 cm
    const maxDice = Math.floor(maxCm * dicePerCm)

    let cols = Math.floor(pixelWidth / 10)
    let rows = Math.floor(pixelHeight / 10)

    // If the number of dice exceeds the limit, scale down proportionally
    if (cols > maxDice || rows > maxDice) {
      const scale = Math.min(maxDice / cols, maxDice / rows)
      cols = Math.floor(cols * scale)
      rows = Math.floor(rows * scale)
    }

    // Load the image into p5.js and trigger update
    imgRef = loadImage(URL.createObjectURL(file), loadedImage => {
      imgOriginalCanvas = loadedImage
      shouldUpdate = true
    })

    // Set output fields
    outputWidthInput.value = cols
    outputHeightInput.value = rows
    outputWidthCmInput.value = toCm(cols, mm)
    outputHeightCmInput.value = toCm(rows, mm)
    contrastSlider.value = 1
    updateTotalDice()
  }
  img.src = URL.createObjectURL(file)
})

// Input listeners for all relevant fields
outputWidthInput.addEventListener('input', () => {
  updateFromDataWidth()
  updateTotalDice()
})
outputHeightInput.addEventListener('input', () => {
  updateFromDataHeight()
  updateTotalDice()
})
outputWidthCmInput.addEventListener('input', () => {
  updateFromCmWidth()
  updateTotalDice()
})
outputHeightCmInput.addEventListener('input', () => {
  updateFromCmHeight()
  updateTotalDice()
})
diceSizeInput.addEventListener('input', () => {
  updateFromDiceSize()
  updateTotalDice()
})
diceValueInput.addEventListener('input', () => {
  updateTotalDice()
})
invertColorInput.addEventListener('change', () => {
  shouldUpdate = true
})
contrastSlider.addEventListener('input', () => {
  shouldUpdate = true
})

// Export PNG button handler
exportButton.addEventListener('click', () => {
  const cols = parseInt(outputWidthInput.value)
  const rows = parseInt(outputHeightInput.value)
  const tileSize = 40

  if (!cols || !rows || !tileSize || imgMatrix.length === 0) {
    alert('Make sure an image is loaded and valid dimensions are set.')
    return
  }

  const buffer = renderToImageBuffer(cols, rows, tileSize, imgMatrix)
  safeSaveCanvas(buffer, getExportFileName('png'))
})

// Helper to safely export PNG, checking for excessive image size
function safeSaveCanvas (canvas, filename) {
  const maxPixels = 8192 * 8192 // safe limit (~67MP)
  const pixelCount = canvas.width * canvas.height

  if (pixelCount > maxPixels) {
    alert(
      'Image too large to export as PNG. Try reducing output size or use SVG instead.'
    )
    return
  }

  try {
    save(canvas, filename)
  } catch (err) {
    alert('Failed to export PNG image.')
    console.error(err)
  }
}

// Helper to generate export file name based on parameters
function getExportFileName (ext) {
  const cols = parseInt(outputWidthInput.value)
  const rows = parseInt(outputHeightInput.value)
  const invert = invertColorInput.checked ? 'inverted' : 'normal'
  return `${baseImageName}_${cols}x${rows}_${invert}.${ext}`
}

// Export TXT button handler
exportTextButton.addEventListener('click', () => {
  const cols = parseInt(outputWidthInput.value)
  const rows = parseInt(outputHeightInput.value)
  const mm = parseFloat(diceSizeInput.value)
  const v = parseFloat(diceValueInput.value)
  const invert = invertColorInput.checked
  const contrast = parseFloat(contrastSlider.value) || 1

  if (!cols || !rows || imgMatrix.length === 0) {
    alert('Image not processed or invalid dimensions.')
    return
  }

  const totalDice = cols * rows
  const totalPrice = isNaN(v) ? 0 : totalDice * v
  const now = new Date()

  // Prepare header for TXT export
  const headerLines = [
    `# Dice Mosaic Reference`,
    `# Original image: ${baseImageName}`,
    `# Export date: ${now.toISOString().replace('T', ' ').substring(0, 19)}`,
    `# Dimensions: ${cols} x ${rows} (columns x rows)`,
    `# Total dice: ${totalDice}`,
    `# Invert colors: ${invert ? 'Yes' : 'No'}`,
    `# Contrast: ${contrast.toFixed(2)}`,
    `# Dice size: ${mm} mm`,
    `# Dice value: $${v.toFixed(2)}`,
    `# Total estimated cost: $${totalPrice.toFixed(2)}`,
    ``
  ]

  let bodyLines = []

  // Add column headers
  const columnHeader = ['']
    .concat(Array.from({ length: cols }, (_, i) => `D${i + 1}`))
    .join('\t')
  bodyLines.push(columnHeader)

  // Add separator line
  const separatorLine = ['--'].concat(Array(cols).fill('---')).join('\t')
  bodyLines.push(separatorLine)

  // Add dice values for each row
  for (let y = 0; y < rows; y++) {
    const row = [`L${y + 1}`]
    for (let x = 0; x < cols; x++) {
      const value = `${grayscaleToDiceLevel(imgMatrix[y * cols + x])}`
      row.push(value)
    }
    bodyLines.push(row.join('\t'))
  }

  // Combine header and body, and trigger download
  const content = headerLines.concat(bodyLines).join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = getExportFileName('txt')
  link.click()
})

// SVG export button handler
document.getElementById('export-svg-button').addEventListener('click', () => {
  if (!imgMatrix || imgMatrix.length === 0) return

  const cols = parseInt(outputWidthInput.value)
  const rows = parseInt(outputHeightInput.value)
  const dieSize = parseFloat(document.getElementById('dice-size').value || '16') // mm
  const radius = dieSize * 0.2

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('xmlns', svgNS)
  svg.setAttribute('width', `${cols * dieSize}mm`)
  svg.setAttribute('height', `${rows * dieSize}mm`)
  svg.setAttribute('viewBox', `0 0 ${cols * dieSize} ${rows * dieSize}`)

  const pipRadius = Math.max(0.5, Math.min(dieSize * 0.12, 2.5))
  const offset = dieSize * 0.25

  const fill = invertColorInput.checked ? '#000000' : '#ffffff'
  const pipColor = invertColorInput.checked ? '#ffffff' : '#000000'

  // Helper to convert grayscale to dice level
  const grayscaleToLevel = avg => {
    if (invertColorInput.checked) avg = 255 - avg
    if (avg >= 213) return 1
    if (avg >= 170) return 2
    if (avg >= 128) return 3
    if (avg >= 85) return 4
    if (avg >= 43) return 5
    return 6
  }

  // Draw a single die at the given position and level
  const drawDie = (col, row, level) => {
    const x = col * dieSize
    const y = row * dieSize
    const cx = x + dieSize / 2
    const cy = y + dieSize / 2
    const left = x + offset
    const right = x + dieSize - offset
    const top = y + offset
    const bottom = y + dieSize - offset

    // Helper to add a pip (circle) to the SVG
    const addCircle = (cx, cy) => {
      const circle = document.createElementNS(svgNS, 'circle')
      circle.setAttribute('cx', cx)
      circle.setAttribute('cy', cy)
      circle.setAttribute('r', pipRadius)
      circle.setAttribute('fill', pipColor)
      svg.appendChild(circle)
    }

    // Draw the die square
    const rect = document.createElementNS(svgNS, 'rect')
    rect.setAttribute('x', x)
    rect.setAttribute('y', y)
    rect.setAttribute('width', dieSize)
    rect.setAttribute('height', dieSize)
    rect.setAttribute('fill', fill)
    rect.setAttribute('rx', radius)
    rect.setAttribute('ry', radius)
    svg.appendChild(rect)

    // Draw pips according to dice level
    if ([1, 3, 5].includes(level)) addCircle(cx, cy)
    if (level >= 2) {
      addCircle(left, top)
      addCircle(right, bottom)
    }
    if (level >= 4) {
      addCircle(right, top)
      addCircle(left, bottom)
    }
    if (level === 6) {
      addCircle(left, cy)
      addCircle(right, cy)
    }
  }

  // Draw all dice in the SVG
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const avg = imgMatrix[y * cols + x]
      const level = grayscaleToLevel(avg)
      drawDie(x, y, level)
    }
  }

  // Serialize and download the SVG
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = getExportFileName('svg')
  link.click()
})
