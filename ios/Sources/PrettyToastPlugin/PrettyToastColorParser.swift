import UIKit

enum PrettyToastColorParser {
    static func parse(_ value: String?) -> UIColor? {
        guard let rawValue = value?.trimmingCharacters(in: .whitespacesAndNewlines),
              !rawValue.isEmpty else {
            return nil
        }

        if rawValue.hasPrefix("#") {
            return parseHex(rawValue)
        }

        if rawValue.lowercased().hasPrefix("rgb") {
            return parseRGB(rawValue)
        }

        switch rawValue.lowercased() {
        case "white": return .white
        case "black": return .black
        case "red": return .red
        case "green": return .green
        case "blue": return .blue
        case "orange": return .orange
        case "yellow": return .yellow
        case "gray", "grey": return .gray
        case "pink": return .systemPink
        case "purple": return .purple
        case "clear": return .clear
        default:
            return nil
        }
    }

    private static func parseHex(_ rawValue: String) -> UIColor? {
        let hex = rawValue.dropFirst()
        let normalized: String

        switch hex.count {
        case 3:
            normalized = hex.map { "\($0)\($0)" }.joined() + "FF"
        case 4:
            normalized = hex.map { "\($0)\($0)" }.joined()
        case 6:
            normalized = String(hex) + "FF"
        case 8:
            normalized = String(hex)
        default:
            return nil
        }

        var value: UInt64 = 0
        guard Scanner(string: normalized).scanHexInt64(&value) else {
            return nil
        }

        let red = CGFloat((value & 0xFF000000) >> 24) / 255
        let green = CGFloat((value & 0x00FF0000) >> 16) / 255
        let blue = CGFloat((value & 0x0000FF00) >> 8) / 255
        let alpha = CGFloat(value & 0x000000FF) / 255
        return UIColor(red: red, green: green, blue: blue, alpha: alpha)
    }

    private static func parseRGB(_ rawValue: String) -> UIColor? {
        guard let openParen = rawValue.firstIndex(of: "("),
              let closeParen = rawValue.lastIndex(of: ")"),
              openParen < closeParen else {
            return nil
        }

        let content = rawValue[rawValue.index(after: openParen)..<closeParen]
        let components = content
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

        guard components.count == 3 || components.count == 4 else {
            return nil
        }

        guard let red = Double(components[0]),
              let green = Double(components[1]),
              let blue = Double(components[2]) else {
            return nil
        }

        let alpha = components.count == 4 ? Double(components[3]) ?? 1 : 1
        return UIColor(
            red: red / 255,
            green: green / 255,
            blue: blue / 255,
            alpha: alpha
        )
    }
}
