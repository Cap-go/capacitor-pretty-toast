import SwiftUI

struct PrettyToastView: View {
    @ObservedObject var window: PassThroughWindow
    @State private var measuredContentHeight: CGFloat = 0

    var body: some View {
        GeometryReader { proxy in
            let safeArea = window.resolvedSafeAreaInsets(geometryInsets: proxy.safeAreaInsets)
            let layout = PrettyToastLayout(
                size: proxy.size,
                safeAreaTop: safeArea.top,
                measuredContentHeight: measuredContentHeight,
                useDynamicIsland: window.useDynamicIsland
            )

            let scaleX: CGFloat = isExpanded ? 1 : (layout.compactWidth / layout.expandedWidth)
            let scaleY: CGFloat = isExpanded ? 1 : (layout.compactHeight / layout.expandedHeight)

            let swipeGesture = DragGesture(minimumDistance: 2).onEnded { value in
                if value.translation.height < -8 || value.predictedEndTranslation.height < -40 {
                    window.swipeDismissRequested = true
                }
            }

            ZStack {
                Group {
                    let pill = toastBackground()
                        .overlay {
                            toastContent(layout)
                                .frame(width: layout.expandedWidth, height: layout.expandedHeight)
                                .scaleEffect(x: scaleX, y: scaleY)
                        }
                        .frame(
                            width: isExpanded ? layout.expandedWidth : layout.compactWidth,
                            height: isExpanded ? layout.expandedHeight : layout.compactHeight
                        )
                        .opacity(layout.hasDynamicIsland ? 1 : (isExpanded ? 1 : 0))
                        .modifier(CapsuleOpacityModifier(
                            haveDynamicIsland: layout.hasDynamicIsland,
                            isExpanded: isExpanded
                        ))
                        .modifier(GeometryGroupModifier())
                        .contentShape(Rectangle())
                        .onTapGesture {
                            window.wasTapped = true
                        }
                        .background(
                            GeometryReader { geo in
                                Color.clear.preference(
                                    key: ToastFrameKey.self,
                                    value: geo.frame(in: .named("overlayWindow"))
                                )
                            }
                        )
                        .onPreferenceChange(ToastFrameKey.self) { frame in
                            if window.toastHitFrame != frame {
                                window.toastHitFrame = frame
                            }
                        }

                    if window.enableSwipeDismiss {
                        pill.gesture(swipeGesture)
                    } else {
                        pill
                    }
                }
                .offset(y: layout.hasDynamicIsland ? (isExpanded ? layout.expandedTopOffset : layout.topOffset) : 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .padding(.top, layout.hasDynamicIsland ? 0 : (isExpanded ? max(safeArea.top, 10) : 0))
            .ignoresSafeArea()
            .coordinateSpace(name: "overlayWindow")
            .animation(.bouncy(duration: 0.3, extraBounce: 0), value: isExpanded)
        }
    }

    @ViewBuilder
    func toastContent(_ layout: PrettyToastLayout) -> some View {
        if let toast = window.toast {
            VStack(spacing: 0) {
                if layout.contentTopClearance > 0 {
                    Spacer(minLength: layout.contentTopClearance)
                }

                toastRow(toast)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, layout.contentBottomPadding)
            .compositingGroup()
            .blur(radius: isExpanded ? 0 : 5)
            .opacity(isExpanded ? 1 : 0)

            // Hidden measurer — drives measuredContentHeight so the pill grows
            // for overflowing text.
            toastRow(toast, isMeasuring: true)
                .padding(.horizontal, 20)
                .fixedSize(horizontal: false, vertical: true)
                .background(
                    GeometryReader { geo in
                        Color.clear.preference(
                            key: ContentHeightKey.self,
                            value: geo.size.height
                        )
                    }
                )
                .hidden()
                .onPreferenceChange(ContentHeightKey.self) { height in
                    measuredContentHeight = height
                }
        }
    }

    @ViewBuilder
    private func toastRow(_ toast: Toast, isMeasuring: Bool = false) -> some View {
        HStack(spacing: 10) {
            ToastIconView(toast: toast, isExpanded: isMeasuring ? true : isExpanded)
                .frame(width: 50)

            VStack(alignment: .leading, spacing: 4) {
                Text(toast.title)
                    .font(.callout)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)

                if !toast.message.isEmpty {
                    Text(toast.message)
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if let label = toast.actionLabel, !label.isEmpty {
                Button(action: {
                    if !isMeasuring {
                        window.actionTapped = true
                    }
                }, label: {
                    Text(label)
                        .font(.footnote)
                        .fontWeight(.semibold)
                        .foregroundStyle(toast.accentColor)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            Capsule().fill(Color.white.opacity(0.12))
                        )
                })
                .buttonStyle(.plain)
                .allowsHitTesting(!isMeasuring)
            }
        }
    }

    private func toastBackground() -> some View {
        let accent = window.toast?.accentColor ?? .white
        let strokeOverride = window.toast?.strokeOverride
        let disableSampling = window.toast?.disableBackdropSampling ?? false
        let tint: BackdropTint = disableSampling ? .gray : window.backdropTint
        return makeStrokeBackground(
            shape: RoundedRectangle(cornerRadius: 30, style: .continuous),
            accent: accent,
            strokeOverride: strokeOverride,
            tint: tint
        )
    }

    private func makeStrokeBackground<S: Shape>(
        shape: S,
        accent: Color,
        strokeOverride: Color?,
        tint: BackdropTint
    ) -> some View {
        shape
            .fill(.black)
            .overlay {
                ZStack {
                    if let override = strokeOverride {
                        strokeLayer(shape: shape, color: override, alpha: 1.0, visible: isExpanded)
                    } else {
                        strokeLayer(shape: shape, color: accent, alpha: 0.2, visible: isExpanded && tint == .colored)
                        strokeLayer(shape: shape, color: .white, alpha: 0.06, visible: isExpanded && tint == .gray)
                    }
                }
            }
    }

    @ViewBuilder
    private func strokeLayer<S: Shape>(shape: S, color: Color, alpha: Double, visible: Bool) -> some View {
        let stroke = shape.stroke(color.opacity(alpha), lineWidth: 1.5)
        if #available(iOS 17, *) {
            // Scope easeInOut to opacity only; frame changes keep the bouncy
            // ambient animation so the stroke tracks the pill geometry.
            stroke.animation(.easeInOut(duration: 0.3)) { view in
                view.opacity(visible ? 1 : 0)
            }
        } else {
            stroke
                .opacity(visible ? 1 : 0)
                .animation(.easeInOut(duration: 0.3), value: visible)
        }
    }

    var isExpanded: Bool {
        window.isPresented
    }
}

struct PrettyToastLayout {
    static let dynamicIslandSafeAreaThreshold: CGFloat = 59
    static let compactIslandWidth: CGFloat = 120
    static let compactIslandHeight: CGFloat = 36
    private static let dynamicIslandBaseHeight: CGFloat = 90
    private static let standardBaseHeight: CGFloat = 70
    private static let topOffsetBase: CGFloat = 11
    private static let expandedTopNudge: CGFloat = -0.5
    private static let dynamicIslandContentGap: CGFloat = 2
    private static let dynamicIslandBottomPadding: CGFloat = 12
    private static let standardContentInset: CGFloat = 20

    let hasDynamicIsland: Bool
    let compactWidth: CGFloat
    let compactHeight: CGFloat
    let topOffset: CGFloat
    let expandedTopOffset: CGFloat
    let expandedWidth: CGFloat
    let expandedHeight: CGFloat
    let contentTopClearance: CGFloat
    let contentBottomPadding: CGFloat
    let baseContentArea: CGFloat

    init(size: CGSize, safeAreaTop: CGFloat, measuredContentHeight: CGFloat, useDynamicIsland: Bool) {
        hasDynamicIsland = safeAreaTop >= Self.dynamicIslandSafeAreaThreshold && useDynamicIsland
        compactWidth = Self.compactIslandWidth
        compactHeight = Self.compactIslandHeight
        topOffset = Self.topOffsetBase + max(safeAreaTop - Self.dynamicIslandSafeAreaThreshold, 0)
        // Nudge up 0.5pt so the centered stroke clears the DI's top line
        // instead of sitting half-behind it.
        expandedTopOffset = topOffset + Self.expandedTopNudge
        expandedWidth = max(1, size.width - (topOffset * 2))

        let baseHeight = hasDynamicIsland ? Self.dynamicIslandBaseHeight : Self.standardBaseHeight
        contentTopClearance = hasDynamicIsland ? Self.compactIslandHeight + Self.dynamicIslandContentGap : 0
        contentBottomPadding = hasDynamicIsland ? Self.dynamicIslandBottomPadding : 0
        let reservedContentInset = hasDynamicIsland
            ? contentTopClearance + contentBottomPadding
            : Self.standardContentInset
        baseContentArea = max(1, baseHeight - reservedContentInset)
        let overflow = max(0, measuredContentHeight - baseContentArea)
        expandedHeight = baseHeight + overflow
    }
}

struct ToastIconView: View {
    let toast: Toast
    let isExpanded: Bool

    var body: some View {
        if let image = toast.customIcon {
            Image(uiImage: image)
                .resizable()
                .renderingMode(.original)
                .aspectRatio(contentMode: .fit)
                .frame(width: 35, height: 35)
        } else {
            Image(systemName: toast.symbol)
                .font(toast.symbolFont)
                .foregroundStyle(toast.symbolForegroundStyle.0, toast.symbolForegroundStyle.1)
                .modifier(WiggleModifier(isExpanded: isExpanded))
        }
    }
}

private struct ContentHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

private struct ToastFrameKey: PreferenceKey {
    static var defaultValue: CGRect = .zero
    static func reduce(value: inout CGRect, nextValue: () -> CGRect) {
        value = nextValue()
    }
}

private struct WiggleModifier: ViewModifier {
    let isExpanded: Bool

    func body(content: Content) -> some View {
        if #available(iOS 18, *) {
            content.symbolEffect(.wiggle, value: isExpanded)
        } else {
            content
        }
    }
}

private struct CapsuleOpacityModifier: ViewModifier {
    let haveDynamicIsland: Bool
    let isExpanded: Bool

    func body(content: Content) -> some View {
        if #available(iOS 17, *) {
            content
                .animation(.linear(duration: 0.02).delay(isExpanded ? 0 : 0.28)) { inner in
                    inner.opacity(haveDynamicIsland ? (isExpanded ? 1 : 0) : 1)
                }
        } else {
            content
                .opacity(haveDynamicIsland ? (isExpanded ? 1 : 0) : 1)
                .animation(.linear(duration: 0.02).delay(isExpanded ? 0 : 0.28), value: isExpanded)
        }
    }
}

private struct GeometryGroupModifier: ViewModifier {
    func body(content: Content) -> some View {
        if #available(iOS 17, *) {
            content.geometryGroup()
        } else {
            content
        }
    }
}
