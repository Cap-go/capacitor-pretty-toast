export type IconSource = string | { uri: string };

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface ToastConfig {
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
  title?: string;
  message?: string;
  duration?: number;
  autoDismiss?: boolean;
  enableSwipeDismiss?: boolean;
  accentColor?: string;
  strokeColor?: string;
  disableBackdropSampling?: boolean;
  action?: ToastAction;
  accessibilityAnnouncement?: string;
  onPress?: () => void;
  onShow?: () => void;
  onHide?: () => void;
  onAutoDismiss?: () => void;
}

export interface ShowOptions {
  force?: boolean;
}

export type PromiseMessages<T> = {
  loading: string | Omit<ToastConfig, 'id'>;
  success: string | ((value: T) => string | Omit<ToastConfig, 'id'>);
  error: string | ((error: unknown) => string | Omit<ToastConfig, 'id'>);
};

export interface ToastRef {
  show: (config: ToastConfig, options?: ShowOptions) => string;
  success: (title: string, config?: Omit<ToastConfig, 'title'>, options?: ShowOptions) => string;
  error: (title: string, config?: Omit<ToastConfig, 'title'>, options?: ShowOptions) => string;
  info: (title: string, config?: Omit<ToastConfig, 'title'>, options?: ShowOptions) => string;
  warning: (title: string, config?: Omit<ToastConfig, 'title'>, options?: ShowOptions) => string;
  loading: (title: string, config?: Omit<ToastConfig, 'title'>, options?: ShowOptions) => string;
  update: (id: string, partial: Partial<Omit<ToastConfig, 'id'>>) => void;
  promise: <T>(promise: Promise<T>, messages: PromiseMessages<T>) => Promise<T>;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
}
