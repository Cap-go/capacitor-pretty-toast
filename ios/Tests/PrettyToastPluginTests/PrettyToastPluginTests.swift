import XCTest
import CoreGraphics
@testable import PrettyToastPlugin

final class PrettyToastPluginTests: XCTestCase {
    func testPluginMetadata() {
        let plugin = PrettyToastPlugin()
        XCTAssertEqual(plugin.identifier, "PrettyToastPlugin")
        XCTAssertEqual(plugin.jsName, "PrettyToast")
    }

    func testPluginMethods() {
        let plugin = PrettyToastPlugin()
        let methodNames = plugin.pluginMethods.map(\.name)
        XCTAssertEqual(methodNames, ["showCurrentToast", "updateCurrentToast", "dismissCurrentToast"])
    }

    func testHexColorParsing() {
        let color = PrettyToastColorParser.parse("#FF0000")
        XCTAssertNotNil(color)
    }

    func testDynamicIslandLayoutReservesCutoutClearanceBeforeTextMeasurement() {
        let layout = PrettyToastLayout(
            size: CGSize(width: 402, height: 874),
            safeAreaTop: 62,
            measuredContentHeight: 0,
            useDynamicIsland: true
        )

        XCTAssertTrue(layout.hasDynamicIsland)
        XCTAssertGreaterThan(layout.contentTopClearance, PrettyToastLayout.compactIslandHeight)
        XCTAssertEqual(layout.contentBottomPadding, 12)
        XCTAssertGreaterThan(layout.baseContentArea, 0)
    }

    func testDynamicIslandLayoutGrowsWithoutChangingCutoutClearance() {
        let initialLayout = PrettyToastLayout(
            size: CGSize(width: 402, height: 874),
            safeAreaTop: 62,
            measuredContentHeight: 0,
            useDynamicIsland: true
        )
        let overflowingContentHeight = initialLayout.baseContentArea + 24
        let measuredLayout = PrettyToastLayout(
            size: CGSize(width: 402, height: 874),
            safeAreaTop: 62,
            measuredContentHeight: overflowingContentHeight,
            useDynamicIsland: true
        )

        XCTAssertEqual(measuredLayout.contentTopClearance, initialLayout.contentTopClearance)
        XCTAssertEqual(measuredLayout.expandedHeight, initialLayout.expandedHeight + 24, accuracy: 0.001)
    }

    func testStandardLayoutDoesNotApplyDynamicIslandClearance() {
        let layout = PrettyToastLayout(
            size: CGSize(width: 390, height: 844),
            safeAreaTop: 47,
            measuredContentHeight: 0,
            useDynamicIsland: true
        )

        XCTAssertFalse(layout.hasDynamicIsland)
        XCTAssertEqual(layout.contentTopClearance, 0)
        XCTAssertEqual(layout.contentBottomPadding, 0)
    }
}
