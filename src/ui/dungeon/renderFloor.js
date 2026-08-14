import { chestFlag, glyphAt } from '../../engine/world/tilemap.js'

/**
 * Canvas renderer for a dungeon floor.
 *
 * Deliberately shapes-and-colours rather than sprites: every tile is a rect
 * with a highlight edge, every prop is two or three primitives. Swapping in
 * real artwork later means changing this file and nothing else.
 */

export const PALETTES = {
  mine: {
    bg: '#0b0705',
    floor: '#5c4830',
    floorAlt: '#54412b',
    wall: '#241a10',
    wallTop: '#3b2c1a',
    rubble: '#3a2c1c',
    accent: '#d59a4a',
    water: '#1d3a52',
  },
  coast: {
    bg: '#03080c',
    floor: '#3d5a63',
    floorAlt: '#375259',
    wall: '#0f2129',
    wallTop: '#1e3a44',
    rubble: '#2b4249',
    accent: '#7fd6e0',
    water: '#0e2c3d',
  },
  chapel: {
    bg: '#050609',
    floor: '#4a4658',
    floorAlt: '#433f50',
    wall: '#191721',
    wallTop: '#2b2836',
    rubble: '#302d3c',
    accent: '#e8d9a0',
    water: '#141a2c',
  },
  spire: {
    bg: '#04070f',
    floor: '#4a5570',
    floorAlt: '#434d66',
    wall: '#141a2a',
    wallTop: '#242e46',
    rubble: '#2c3446',
    accent: '#8fd0ff',
    water: '#16263c',
  },
  ruins: {
    bg: '#07080d',
    floor: '#454b63',
    floorAlt: '#3f4459',
    wall: '#181b26',
    wallTop: '#2a2f40',
    rubble: '#2c3040',
    accent: '#9db4e0',
    water: '#16283c',
  },
  caldera: {
    bg: '#120503',
    floor: '#6b2e1d',
    floorAlt: '#612916',
    wall: '#230d07',
    wallTop: '#3d1810',
    rubble: '#43180f',
    accent: '#ff8a3d',
    water: '#5a1c08',
  },
}

/**
 * Tile size first, grid second.
 *
 * Fixing the grid and fitting it to the canvas letterboxes a tall phone
 * screen; fixing the tile size and deriving the grid fills it, and naturally
 * shows more of the map on a bigger display.
 */
export function tileSizeFor(width) {
  const target = width < 520 ? width / 11 : width / 17
  return Math.max(22, Math.min(64, Math.floor(target)))
}

export function viewportTiles(width, height) {
  const size = tileSizeFor(width)
  return { cols: Math.ceil(width / size), rows: Math.ceil(height / size), size }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Camera centred on the party, clamped so it never shows past the edge of a
 * floor -- unless the floor is smaller than the view, in which case it centres.
 */
export function cameraFor(floor, focus, cols, rows) {
  const x =
    floor.width <= cols
      ? (floor.width - cols) / 2
      : clamp(focus.x - (cols - 1) / 2, 0, floor.width - cols)
  const y =
    floor.height <= rows
      ? (floor.height - rows) / 2
      : clamp(focus.y - (rows - 1) / 2, 0, floor.height - rows)
  return { x, y }
}

function drawTile(ctx, glyph, px, py, size, palette, x, y) {
  switch (glyph) {
    case '#': {
      ctx.fillStyle = palette.wall
      ctx.fillRect(px, py, size, size)
      // A lighter cap on top of each block reads as depth without artwork.
      ctx.fillStyle = palette.wallTop
      ctx.fillRect(px, py, size, Math.max(2, size * 0.22))
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 1
      ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1)
      break
    }

    case ' ':
      ctx.fillStyle = palette.bg
      ctx.fillRect(px, py, size, size)
      break

    case '~':
      ctx.fillStyle = palette.water
      ctx.fillRect(px, py, size, size)
      break

    case '"':
      ctx.fillStyle = palette.rubble
      ctx.fillRect(px, py, size, size)
      break

    default: {
      // Checker the floor very slightly so movement is legible.
      ctx.fillStyle = (x + y) % 2 === 0 ? palette.floor : palette.floorAlt
      ctx.fillRect(px, py, size, size)
      break
    }
  }
}

function drawStairs(ctx, px, py, size, palette, down) {
  ctx.fillStyle = palette.accent
  const steps = 3
  for (let i = 0; i < steps; i++) {
    const h = size / (steps + 1)
    const w = size * (down ? (steps - i) / steps : (i + 1) / steps)
    ctx.fillRect(px + (size - w) / 2, py + h * (i + 0.6), w, h * 0.7)
  }
}

function drawChest(ctx, px, py, size, palette) {
  const w = size * 0.6
  const h = size * 0.5
  const x = px + (size - w) / 2
  const y = py + (size - h) / 2
  ctx.fillStyle = '#8a5a24'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = palette.accent
  ctx.fillRect(x, y, w, h * 0.34)
  ctx.strokeStyle = '#2a1a08'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, w, h)
}

function drawMarker(ctx, px, py, size, color) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(px + size / 2, py + size / 2, size * 0.26, 0, Math.PI * 2)
  ctx.fill()
}

function drawParty(ctx, px, py, size, color, facing) {
  const w = size * 0.62
  const x = px + (size - w) / 2
  const y = py + (size - w) / 2

  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.beginPath()
  ctx.ellipse(px + size / 2, y + w * 0.98, w * 0.42, w * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = color
  ctx.fillRect(x, y, w, w)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeRect(x, y, w, w)

  // A notch on the leading edge, so facing is readable while standing still.
  ctx.fillStyle = '#ffffff'
  const n = w * 0.22
  const cx = x + w / 2 - n / 2
  const cy = y + w / 2 - n / 2
  const offsets = {
    up: [cx, y - n * 0.4],
    down: [cx, y + w - n * 0.6],
    left: [x - n * 0.4, cy],
    right: [x + w - n * 0.6, cy],
  }
  const [nx, ny] = offsets[facing] ?? offsets.down
  ctx.fillRect(nx, ny, n, n)
}

/**
 * Draw one frame.
 *
 * `focus` is the party's animated (fractional) position, which is what makes
 * a step glide instead of teleport.
 */
export function renderFloor(ctx, options) {
  const {
    floor,
    focus,
    facing,
    flags,
    palette: paletteId,
    partyColor,
    width,
    height,
  } = options

  const palette = PALETTES[paletteId] ?? PALETTES.mine
  const { cols, rows, size } = viewportTiles(width, height)
  const camera = cameraFor(floor, focus, cols, rows)

  // Centre the party in the viewport, then let the camera clamp pull it back
  // at the edges of the floor.
  const offsetX = Math.round(width / 2 - (camera.x + cols / 2) * size)
  const offsetY = Math.round(height / 2 - (camera.y + rows / 2) * size)

  ctx.fillStyle = palette.bg
  ctx.fillRect(0, 0, width, height)

  const firstX = Math.max(0, Math.floor(camera.x) - 1)
  const lastX = Math.min(floor.width - 1, Math.ceil(camera.x + cols) + 1)
  const firstY = Math.max(0, Math.floor(camera.y) - 1)
  const lastY = Math.min(floor.height - 1, Math.ceil(camera.y + rows) + 1)

  for (let y = firstY; y <= lastY; y++) {
    for (let x = firstX; x <= lastX; x++) {
      const px = offsetX + x * size
      const py = offsetY + y * size
      const glyph = glyphAt(floor, x, y)

      drawTile(ctx, glyph, px, py, size, palette, x, y)

      switch (glyph) {
        case 'C':
          if (!flags[chestFlag(floor, x, y)]) drawChest(ctx, px, py, size, palette)
          break
        case '>':
          drawStairs(ctx, px, py, size, palette, true)
          break
        case '<':
          drawStairs(ctx, px, py, size, palette, false)
          break
        case 'E':
          drawMarker(ctx, px, py, size, '#7dd3a0')
          break
        case 'B': {
          const detail = floor.props[`${x},${y}`]
          if (!detail?.flag || !flags[detail.flag]) {
            drawMarker(ctx, px, py, size, '#e8503a')
          }
          break
        }
        case 'D':
          ctx.fillStyle = '#6b4a22'
          ctx.fillRect(px + size * 0.1, py + size * 0.05, size * 0.8, size * 0.9)
          break
        default:
          break
      }
    }
  }

  drawParty(
    ctx,
    offsetX + focus.x * size,
    offsetY + focus.y * size,
    size,
    partyColor,
    facing,
  )
}
