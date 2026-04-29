import SwiftUI
import UIKit

struct Toast {
    private(set) var id: String = UUID().uuidString
    var symbol: String
    var symbolFont: Font
    var symbolForegroundStyle: (Color, Color)
    var title: String
    var message: String
    /// Optional custom icon image, resolved from an ImageSourcePropType URI.
    /// When present, overrides the SF Symbol.
    var customIcon: UIImage?
    /// Explicit accent override — when set, drives both the icon fill and the
    /// pill's accent stroke, bypassing the symbol-derived default.
    var accentOverride: Color?
    /// Explicit stroke color — when set, bypasses the backdrop sampler and
    /// paints a fixed outline.
    var strokeOverride: Color?
    /// Skip the backdrop luminance sampler. The outline falls back to the
    /// neutral gray stroke on any backdrop.
    var disableBackdropSampling: Bool = false
    /// Label for an optional trailing action button in the pill.
    var actionLabel: String?

    /// SF Symbol fill color — doubles as the pill's accent tint for the
    /// Apple-style stroke we draw around the expanded pill in dark mode.
    var accentColor: Color { accentOverride ?? symbolForegroundStyle.1 }
}
