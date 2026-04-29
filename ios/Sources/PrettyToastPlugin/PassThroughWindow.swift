import SwiftUI
import Combine

enum BackdropTint {
    case colored
    case gray
}

class PassThroughWindow: UIWindow, ObservableObject {
    @Published var toast: Toast?
    @Published var isPresented: Bool = false
    @Published var useDynamicIsland: Bool = true
    @Published var wasTapped: Bool = false
    @Published var actionTapped: Bool = false

    @Published var backdropTint: BackdropTint = .gray

    private var backdropTimer: Timer?
    // Debounce so the stroke doesn't flicker when the sampled luma
    // briefly crosses the flip point during scroll/transition.
    private var pendingTint: BackdropTint?
    private var pendingTintSince: CFAbsoluteTime = 0

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        guard let hitView = super.hitTest(point, with: event),
              let rootView = rootViewController?.view else {
            return nil
        }

        if hitView == rootView {
            for subview in rootView.subviews.reversed() {
                let pointInSubView = subview.convert(point, from: rootView)
                if let nestedHit = subview.hitTest(pointInSubView, with: event) {
                    return nestedHit
                }
            }
            return nil
        }

        return hitView
    }

    // MARK: - Backdrop sampling

    func startBackdropSampling() {
        stopBackdropSampling()
        sampleBackdrop()
        // `.common` mode keeps the timer firing during scroll tracking;
        // the default mode would pause while a ScrollView is being dragged.
        let timer = Timer(timeInterval: 0.25, repeats: true) { [weak self] _ in
            self?.sampleBackdrop()
        }
        RunLoop.main.add(timer, forMode: .common)
        backdropTimer = timer
    }

    func stopBackdropSampling() {
        backdropTimer?.invalidate()
        backdropTimer = nil
        pendingTint = nil
    }

    deinit {
        stopBackdropSampling()
    }

    private func sampleBackdrop() {
        guard let scene = windowScene else { return }
        // Pick the backmost window so we sample the app, not transient
        // overlays (dev menu, keyboard, alerts). `windows` isn't ordered.
        let candidates = scene.windows.filter { $0 !== self && !$0.isHidden }
        guard let contentWindow = candidates.min(by: { $0.windowLevel < $1.windowLevel }) else { return }

        let bitmapWidth = 32
        let bitmapHeight = 8
        var pixels = [UInt8](repeating: 0, count: bitmapWidth * bitmapHeight * 4)

        guard let context = CGContext(
            data: &pixels,
            width: bitmapWidth,
            height: bitmapHeight,
            bitsPerComponent: 8,
            bytesPerRow: bitmapWidth * 4,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return }

        // Top strip under the pill. `layer.render` cost scales with area.
        let sampleRect = CGRect(
            x: 0, y: 0,
            width: contentWindow.bounds.width,
            height: 80
        )

        // Flip + scale CG coords to UIKit (top-left origin) for layer.render.
        context.saveGState()
        context.translateBy(x: 0, y: CGFloat(bitmapHeight))
        context.scaleBy(x: 1, y: -1)
        let scaleX = CGFloat(bitmapWidth) / sampleRect.width
        let scaleY = CGFloat(bitmapHeight) / sampleRect.height
        context.scaleBy(x: scaleX, y: scaleY)
        context.translateBy(x: -sampleRect.origin.x, y: -sampleRect.origin.y)
        contentWindow.layer.render(in: context)
        context.restoreGState()

        var totalLuma: Double = 0
        let pixelCount = bitmapWidth * bitmapHeight
        for pixelIndex in 0..<pixelCount {
            let red = Double(pixels[pixelIndex * 4 + 0]) / 255.0
            let green = Double(pixels[pixelIndex * 4 + 1]) / 255.0
            let blue = Double(pixels[pixelIndex * 4 + 2]) / 255.0
            totalLuma += 0.299 * red + 0.587 * green + 0.114 * blue
        }
        let avgLuma = totalLuma / Double(pixelCount)

        // Flip around ~#0E luma with ±0.005 hysteresis: below → accent
        // stroke, above → neutral. Matches Apple's DI behavior.
        let tint: BackdropTint
        switch backdropTint {
        case .colored:
            tint = avgLuma > 0.060 ? .gray : .colored
        default:
            tint = avgLuma < 0.050 ? .colored : .gray
        }

        if tint == backdropTint {
            pendingTint = nil
            return
        }

        let now = CFAbsoluteTimeGetCurrent()
        if pendingTint != tint {
            pendingTint = tint
            pendingTintSince = now
            return
        }

        if now - pendingTintSince >= 0.25 {
            backdropTint = tint
            pendingTint = nil
        }
    }
}
