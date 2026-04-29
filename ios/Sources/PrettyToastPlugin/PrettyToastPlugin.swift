import Capacitor
import Foundation
import UIKit

@objc(PrettyToastPlugin)
public class PrettyToastPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PrettyToastPlugin"
    public let jsName = "PrettyToast"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "showCurrentToast", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateCurrentToast", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "dismissCurrentToast", returnType: CAPPluginReturnPromise)
    ]

    private let manager = ToastManager()
    private var currentToastId: String?

    override public func load() {
        manager.onDismiss = { [weak self] in
            guard let self, let toastId = self.currentToastId else { return }
            self.notifyListeners("toastDismiss", data: ["id": toastId])
            self.currentToastId = nil
        }

        manager.onPress = { [weak self] in
            guard let self, let toastId = self.currentToastId else { return }
            self.notifyListeners("toastPress", data: ["id": toastId])
        }

        manager.onActionPress = { [weak self] in
            guard let self, let toastId = self.currentToastId else { return }
            self.notifyListeners("toastActionPress", data: ["id": toastId])
        }
    }

    @objc func showCurrentToast(_ call: CAPPluginCall) {
        guard let payload = parsePayload(call) else { return }

        currentToastId = payload.id

        DispatchQueue.main.async { [weak self] in
            self?.manager.show(
                icon: payload.icon,
                iconUri: payload.iconUri,
                title: payload.title,
                message: payload.message,
                duration: payload.duration,
                autoDismiss: payload.autoDismiss,
                enableSwipeDismiss: payload.enableSwipeDismiss,
                useDynamicIsland: payload.useDynamicIsland,
                accentColor: payload.accentColor,
                strokeColor: payload.strokeColor,
                disableBackdropSampling: payload.disableBackdropSampling,
                actionLabel: payload.actionLabel,
                accessibilityAnnouncement: payload.accessibilityAnnouncement
            )
            call.resolve()
        }
    }

    @objc func updateCurrentToast(_ call: CAPPluginCall) {
        guard let payload = parsePayload(call) else { return }
        if let currentToastId, currentToastId != payload.id {
            call.resolve()
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.manager.update(
                icon: payload.icon,
                iconUri: payload.iconUri,
                title: payload.title,
                message: payload.message,
                duration: payload.duration,
                autoDismiss: payload.autoDismiss,
                accentColor: payload.accentColor,
                strokeColor: payload.strokeColor,
                disableBackdropSampling: payload.disableBackdropSampling,
                actionLabel: payload.actionLabel
            )
            call.resolve()
        }
    }

    @objc func dismissCurrentToast(_ call: CAPPluginCall) {
        let requestedId = call.getString("id")
        if let requestedId, let currentToastId, requestedId != currentToastId {
            call.resolve()
            return
        }

        DispatchQueue.main.async { [weak self] in
            self?.manager.dismiss()
            call.resolve()
        }
    }

    private func parsePayload(_ call: CAPPluginCall) -> ToastPayload? {
        guard let id = call.getString("id") else {
            call.reject("Missing required parameter: id")
            return nil
        }

        return ToastPayload(
            id: id,
            icon: call.getString("icon") ?? "",
            iconUri: call.getString("iconUri") ?? "",
            title: call.getString("title") ?? "",
            message: call.getString("message") ?? "",
            duration: call.getInt("duration") ?? 3000,
            autoDismiss: call.getBool("autoDismiss") ?? true,
            enableSwipeDismiss: call.getBool("enableSwipeDismiss") ?? true,
            useDynamicIsland: call.getBool("useDynamicIsland") ?? true,
            accentColor: PrettyToastColorParser.parse(call.getString("accentColor")),
            strokeColor: PrettyToastColorParser.parse(call.getString("strokeColor")),
            disableBackdropSampling: call.getBool("disableBackdropSampling") ?? false,
            actionLabel: call.getString("actionLabel") ?? "",
            accessibilityAnnouncement: call.getString("accessibilityAnnouncement") ?? ""
        )
    }
}

private struct ToastPayload {
    let id: String
    let icon: String
    let iconUri: String
    let title: String
    let message: String
    let duration: Int
    let autoDismiss: Bool
    let enableSwipeDismiss: Bool
    let useDynamicIsland: Bool
    let accentColor: UIColor?
    let strokeColor: UIColor?
    let disableBackdropSampling: Bool
    let actionLabel: String
    let accessibilityAnnouncement: String
}
