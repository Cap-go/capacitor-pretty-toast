export type IconSource = string | { uri: string };

export interface ToastAction {
  /**
   * Text shown for the native/web action button.
   */
  label: string;
  /**
   * Called when the action button is pressed.
   */
  onPress: () => void;
}

export interface ToastConfig {
  /**
   * Optional stable toast id. A generated id is returned when omitted.
   */
  id?: string;
  /**
   * Accepts either an SF-symbol-like identifier or raw SVG markup.
   * SVG mode is enabled only when the string starts with `<svg` after trim.
   */
  icon?: string;
  /**
   * URI-like image source. Supports `https://`, `http://`, `file://`,
   * absolute file paths, `data:` URLs, `blob:` URLs, or `{ uri }`.
   *
   * `iconSource` always wins over `icon`.
   */
  iconSource?: IconSource;
  /**
   * Main toast title.
   */
  title?: string;
  /**
   * Secondary toast message.
   */
  message?: string;
  /**
   * Auto-dismiss delay in milliseconds.
   */
  duration?: number;
  /**
   * Whether the toast dismisses itself after `duration`.
   */
  autoDismiss?: boolean;
  /**
   * Whether swipe-to-dismiss is enabled on native overlays.
   */
  enableSwipeDismiss?: boolean;
  /**
   * CSS-style accent color used by native/web renderers.
   */
  accentColor?: string;
  /**
   * CSS-style border/stroke color.
   */
  strokeColor?: string;
  /**
   * Disable Android/iOS backdrop sampling behind the toast.
   */
  disableBackdropSampling?: boolean;
  /**
   * Optional action button configuration.
   */
  action?: ToastAction;
  /**
   * Text announced to assistive technologies when the toast is shown.
   */
  accessibilityAnnouncement?: string;
  /**
   * Called when the toast body is pressed.
   */
  onPress?: () => void;
  /**
   * Called when the toast becomes visible.
   */
  onShow?: () => void;
  /**
   * Called when the toast is dismissed.
   */
  onHide?: () => void;
  /**
   * Called when the toast is dismissed by its timer.
   */
  onAutoDismiss?: () => void;
}

export interface ShowOptions {
  /**
   * Dismiss the current toast and show this one immediately.
   */
  force?: boolean;
}

export type PromiseMessages<T> = {
  loading: string | ToastConfig;
  success: string | ((value: T) => string | ToastConfig);
  error: string | ((error: unknown) => string | ToastConfig);
};

/**
 * Public toast controller exposed as `toast`.
 */
export interface PrettyToastPlugin {
  /**
   * Show a custom toast and return its id.
   */
  show(config: ToastConfig, options?: ShowOptions): string;
  /**
   * Show a success toast.
   */
  success(title: string, config?: ToastConfig, options?: ShowOptions): string;
  /**
   * Show an error toast.
   */
  error(title: string, config?: ToastConfig, options?: ShowOptions): string;
  /**
   * Show an informational toast.
   */
  info(title: string, config?: ToastConfig, options?: ShowOptions): string;
  /**
   * Show a warning toast.
   */
  warning(title: string, config?: ToastConfig, options?: ShowOptions): string;
  /**
   * Show a loading toast. Loading toasts do not auto-dismiss by default.
   */
  loading(title: string, config?: ToastConfig, options?: ShowOptions): string;
  /**
   * Update an existing toast by id.
   */
  update(id: string, partial: ToastConfig): void;
  /**
   * Show a loading toast while a promise is pending, then update it for success or error.
   */
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>): Promise<T>;
  /**
   * Dismiss one toast by id, or the current toast when no id is provided.
   */
  dismiss(id?: string): void;
  /**
   * Dismiss the current toast and clear the queue.
   */
  dismissAll(): void;
}

export type ToastRef = PrettyToastPlugin;
