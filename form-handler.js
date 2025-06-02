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

let imgRef // avoid warning, p5 uses the global `img` variable in the sketch
let baseImageName = ''
let aspectRatio = null

// Helpers
const toCm = (px, mm) => ((px * mm) / 10).toFixed(1)
const toPx = (cm, mm) => Math.round((cm * 10) / mm)

// Update based on dice width
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

// Update based on dice height
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

// Update based on width in cm
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

// Update based on height in cm
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

// Update when dice size changes
function updateFromDiceSize () {
  if (!aspectRatio) return
  const mm = parseFloat(diceSizeInput.value) || 16
  const w = parseInt(outputWidthInput.value)
  const h = parseInt(outputHeightInput.value)

  outputWidthCmInput.value = toCm(w, mm)
  outputHeightCmInput.value = toCm(h, mm)
}

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

// Image upload
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

    imgRef = loadImage(URL.createObjectURL(file), loadedImage => {
      imgOriginalCanvas = loadedImage
      shouldUpdate = true
    })

    outputWidthInput.value = pixelWidth / 10
    outputHeightInput.value = pixelHeight / 10
    outputWidthCmInput.value = toCm(outputWidthInput.value, mm)
    outputHeightCmInput.value = toCm(outputHeightInput.value, mm)
    contrastSlider.value = 1 // Reset contrast to default
    updateTotalDice()
  }
  img.src = URL.createObjectURL(file)
})

// Listeners
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

function getExportFileName (ext) {
  const cols = parseInt(outputWidthInput.value)
  const rows = parseInt(outputHeightInput.value)
  const invert = invertColorInput.checked ? 'inverted' : 'normal'
  return `${baseImageName}_${cols}x${rows}_${invert}.${ext}`
}

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

  // Column headers
  const columnHeader = ['']
    .concat(Array.from({ length: cols }, (_, i) => `D${i + 1}`))
    .join('\t')
  bodyLines.push(columnHeader)

  // Separator line
  const separatorLine = ['--'].concat(Array(cols).fill('---')).join('\t')
  bodyLines.push(separatorLine)

  for (let y = 0; y < rows; y++) {
    const row = [`L${y + 1}`]
    for (let x = 0; x < cols; x++) {
      const value = `${grayscaleToDiceLevel(imgMatrix[y * cols + x])}`
      row.push(value)
    }
    bodyLines.push(row.join('\t'))
  }

  const content = headerLines.concat(bodyLines).join('\n')

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = getExportFileName('txt')
  link.click()
})

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

  const grayscaleToLevel = avg => {
    if (invertColorInput.checked) avg = 255 - avg
    if (avg >= 213) return 1
    if (avg >= 170) return 2
    if (avg >= 128) return 3
    if (avg >= 85) return 4
    if (avg >= 43) return 5
    return 6
  }

  const drawDie = (col, row, level) => {
    const x = col * dieSize
    const y = row * dieSize
    const cx = x + dieSize / 2
    const cy = y + dieSize / 2
    const left = x + offset
    const right = x + dieSize - offset
    const top = y + offset
    const bottom = y + dieSize - offset

    const addCircle = (cx, cy) => {
      const circle = document.createElementNS(svgNS, 'circle')
      circle.setAttribute('cx', cx)
      circle.setAttribute('cy', cy)
      circle.setAttribute('r', pipRadius)
      circle.setAttribute('fill', pipColor)
      svg.appendChild(circle)
    }

    const rect = document.createElementNS(svgNS, 'rect')
    rect.setAttribute('x', x)
    rect.setAttribute('y', y)
    rect.setAttribute('width', dieSize)
    rect.setAttribute('height', dieSize)
    rect.setAttribute('fill', fill)
    rect.setAttribute('rx', radius)
    rect.setAttribute('ry', radius)
    svg.appendChild(rect)

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

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const avg = imgMatrix[y * cols + x]
      const level = grayscaleToLevel(avg)
      drawDie(x, y, level)
    }
  }

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = getExportFileName('svg')
  link.click()
})
