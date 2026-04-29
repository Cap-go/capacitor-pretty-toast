// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapgoCapacitorPrettyToast",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapgoCapacitorPrettyToast",
            targets: ["PrettyToastPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "PrettyToastPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/PrettyToastPlugin"),
        .testTarget(
            name: "PrettyToastPluginTests",
            dependencies: ["PrettyToastPlugin"],
            path: "ios/Tests/PrettyToastPluginTests")
    ]
)
