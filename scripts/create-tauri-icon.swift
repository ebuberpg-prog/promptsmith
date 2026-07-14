import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let sourceURL = root.appendingPathComponent("public/pwa-192x192.png")
let outputURL = root.appendingPathComponent("src-tauri/icons/icon.png")

guard let source = NSImage(contentsOf: sourceURL) else {
    fatalError("Could not read the MUSE source icon")
}

let pixels = 512
guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pixels,
    pixelsHigh: pixels,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    fatalError("Could not create the native icon canvas")
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
NSColor.clear.setFill()
NSRect(x: 0, y: 0, width: pixels, height: pixels).fill()
source.draw(
    in: NSRect(x: 0, y: 0, width: pixels, height: pixels),
    from: NSRect(origin: .zero, size: source.size),
    operation: .sourceOver,
    fraction: 1
)
NSGraphicsContext.restoreGraphicsState()

guard let data = bitmap.representation(using: .png, properties: [:]) else {
    fatalError("Could not encode the native icon")
}

try data.write(to: outputURL, options: .atomic)
