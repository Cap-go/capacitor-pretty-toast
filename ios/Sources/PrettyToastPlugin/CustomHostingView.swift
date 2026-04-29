import SwiftUI

class CustomHostingView: UIHostingController<PrettyToastView> {
    var isStatusBarHidden: Bool = false {
        didSet {
            setNeedsStatusBarAppearanceUpdate()
        }
    }

    override var prefersStatusBarHidden: Bool {
        return isStatusBarHidden
    }
}
