import XCTest
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
}
