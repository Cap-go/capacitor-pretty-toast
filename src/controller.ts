import type { PromiseMessages, ShowOptions, ToastConfig, ToastRef } from './definitions';
import type { ToastDriver } from './driver';
import {
  blobUrlToDataUrl,
  getAccessibilityAnnouncement,
  isNativeSafeIconUri,
  isSvgIcon,
  normalizeIconSource,
  rasterizeSvgToPngDataUrl,
  DEFAULT_ICON_SYMBOL,
} from './icons';
import type { InternalToastPayload } from './internal-types';

type ToastVariant = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ToastConfigInternal extends ToastConfig {
  _fallbackIcon?: string;
}

interface ToastEntry extends ToastConfigInternal {
  id: string;
  iconSymbol: string;
  iconSourceUri?: string;
  rawSvg?: string;
  resolvedIconUri?: string;
  isPreparingSvg: boolean;
}

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: 'checkmark.circle.fill',
  error: 'xmark.circle.fill',
  info: 'info.circle.fill',
  warning: 'exclamationmark.triangle.fill',
  loading: 'arrow.triangle.2.circlepath',
};

export class ToastController {
  private queue: ToastEntry[] = [];
  private current: ToastEntry | null = null;
  private isShowing = false;
  private idCounter = 0;
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private autoDismissed = false;

  readonly ref: ToastRef;

  constructor(private readonly driver: ToastDriver) {
    this.driver.subscribe({
      onDismiss: (event) => this.handleDismiss(event.id),
      onPress: (event) => this.handlePress(event.id),
      onActionPress: (event) => this.handleActionPress(event.id),
    });

    this.ref = {
      show: (config, options) => this.show(config, options),
      success: (title, config, options) => this.showVariant('success', title, config, options),
      error: (title, config, options) => this.showVariant('error', title, config, options),
      info: (title, config, options) => this.showVariant('info', title, config, options),
      warning: (title, config, options) => this.showVariant('warning', title, config, options),
      loading: (title, config, options) => this.showVariant('loading', title, config, options),
      update: (id, partial) => this.update(id, partial),
      promise: <T>(promise: Promise<T>, messages: PromiseMessages<T>) => this.promise(promise, messages),
      dismiss: (id?: string) => this.dismiss(id),
      dismissAll: () => this.dismissAll(),
    };
  }

  show(config: ToastConfig, options?: ShowOptions): string {
    const id = config.id ?? this.generateId();
    const entry = this.hydrateEntry({ ...config, id });

    if (options?.force && this.isShowing) {
      this.queue.unshift(entry);
      this.clearAutoDismissTimer();
      this.autoDismissed = false;
      void this.driver.dismiss(this.current?.id);
      return id;
    }

    if (!this.isShowing) {
      this.presentToast(entry);
      return id;
    }

    this.queue.push(entry);
    this.prepareSvgIcon(entry);
    return id;
  }

  update(id: string, partial: Partial<Omit<ToastConfig, 'id'>>): void {
    if (this.current?.id === id) {
      this.current = this.hydrateEntry({ ...this.current, ...partial, id }, this.current);
      this.armAutoDismissTimer(this.current);
      void this.driver.update(this.buildPayload(this.current));
      this.prepareSvgIcon(this.current);
      return;
    }

    const index = this.queue.findIndex((entry) => entry.id === id);
    if (index === -1) return;

    const existing = this.queue[index];
    const updated = this.hydrateEntry({ ...existing, ...partial, id }, existing);
    this.queue[index] = updated;
    this.prepareSvgIcon(updated);
  }

  dismiss(id?: string): void {
    if (id && this.current?.id !== id) {
      this.queue = this.queue.filter((entry) => entry.id !== id);
      return;
    }
    if (!this.current) return;
    this.clearAutoDismissTimer();
    this.autoDismissed = false;
    void this.driver.dismiss(this.current.id);
  }

  dismissAll(): void {
    this.queue = [];
    if (!this.current) return;
    this.clearAutoDismissTimer();
    this.autoDismissed = false;
    void this.driver.dismiss(this.current.id);
  }

  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>): Promise<T> {
    const loadingConfig =
      typeof messages.loading === 'string'
        ? ({ title: messages.loading } satisfies ToastConfig)
        : { ...messages.loading };

    if (loadingConfig.autoDismiss === undefined) {
      loadingConfig.autoDismiss = false;
    }
    if (!loadingConfig.icon) {
      loadingConfig.icon = VARIANT_ICONS.loading;
    }

    const id = this.show(loadingConfig);

    promise.then(
      (value) => {
        const next = typeof messages.success === 'function' ? messages.success(value) : messages.success;
        const config = typeof next === 'string' ? ({ title: next } satisfies ToastConfig) : { ...next };
        if (!config.icon) config.icon = VARIANT_ICONS.success;
        if (config.autoDismiss === undefined) config.autoDismiss = true;
        if (config.duration === undefined) config.duration = 3000;
        this.update(id, config);
      },
      (error) => {
        const next = typeof messages.error === 'function' ? messages.error(error) : messages.error;
        const config = typeof next === 'string' ? ({ title: next } satisfies ToastConfig) : { ...next };
        if (!config.icon) config.icon = VARIANT_ICONS.error;
        if (config.autoDismiss === undefined) config.autoDismiss = true;
        if (config.duration === undefined) config.duration = 3000;
        this.update(id, config);
      },
    );

    return promise;
  }

  private showVariant(
    variant: ToastVariant,
    title: string,
    config?: Omit<ToastConfig, 'title'>,
    options?: ShowOptions,
  ): string {
    const toastConfig: ToastConfigInternal = {
      ...config,
      title,
      icon: config?.icon ?? VARIANT_ICONS[variant],
      _fallbackIcon: VARIANT_ICONS[variant],
    };

    if (variant === 'loading' && toastConfig.autoDismiss === undefined) {
      toastConfig.autoDismiss = false;
    }

    return this.show(toastConfig, options);
  }

  private presentToast(entry: ToastEntry): void {
    this.isShowing = true;
    this.current = entry;
    this.armAutoDismissTimer(entry);
    entry.onShow?.();
    void this.driver.show(this.buildPayload(entry));
    this.prepareSvgIcon(entry);
  }

  private showNext(): void {
    const next = this.queue.shift();
    if (!next) {
      this.isShowing = false;
      this.current = null;
      return;
    }
    this.presentToast(next);
  }

  private handleDismiss(id: string): void {
    if (!this.current || this.current.id !== id) return;
    const entry = this.current;
    this.clearAutoDismissTimer();
    if (this.autoDismissed) {
      entry.onAutoDismiss?.();
    }
    entry.onHide?.();
    this.autoDismissed = false;
    this.showNext();
  }

  private handlePress(id: string): void {
    if (!this.current || this.current.id !== id || !this.current.onPress) return;
    this.current.onPress();
    this.clearAutoDismissTimer();
    this.autoDismissed = false;
    void this.driver.dismiss(id);
  }

  private handleActionPress(id: string): void {
    if (!this.current || this.current.id !== id || !this.current.action) return;
    this.current.action.onPress();
    this.clearAutoDismissTimer();
    this.autoDismissed = false;
    void this.driver.dismiss(id);
  }

  private armAutoDismissTimer(entry: ToastEntry): void {
    this.clearAutoDismissTimer();
    this.autoDismissed = false;
    const autoDismiss = entry.autoDismiss ?? true;
    const duration = entry.duration ?? 3000;
    if (!autoDismiss || duration <= 0) return;

    this.autoDismissTimer = setTimeout(() => {
      this.autoDismissTimer = null;
      this.autoDismissed = true;
    }, duration);
  }

  private clearAutoDismissTimer(): void {
    if (!this.autoDismissTimer) return;
    clearTimeout(this.autoDismissTimer);
    this.autoDismissTimer = null;
  }

  private hydrateEntry(config: ToastConfigInternal & { id: string }, previous?: ToastEntry): ToastEntry {
    const iconSourceUri = normalizeIconSource(config.iconSource);
    const rawIcon = typeof config.icon === 'string' ? config.icon : '';
    const rawSvg = !iconSourceUri && isSvgIcon(rawIcon) ? rawIcon.trim() : undefined;
    const fallbackIcon = config._fallbackIcon ?? previous?._fallbackIcon ?? DEFAULT_ICON_SYMBOL;
    const iconSymbol = rawSvg ? fallbackIcon : rawIcon || fallbackIcon;
    const resolvedIconUri =
      iconSourceUri && isNativeSafeIconUri(iconSourceUri)
        ? iconSourceUri
        : rawSvg && previous?.rawSvg === rawSvg
          ? previous.resolvedIconUri
          : iconSourceUri && previous?.iconSourceUri === iconSourceUri
            ? previous.resolvedIconUri
            : undefined;

    return {
      ...config,
      id: config.id,
      iconSymbol,
      iconSourceUri,
      rawSvg,
      resolvedIconUri,
      isPreparingSvg: rawSvg ? (previous?.isPreparingSvg ?? false) : false,
    };
  }

  private buildPayload(entry: ToastEntry): InternalToastPayload {
    const iconUri = entry.iconSourceUri ?? entry.resolvedIconUri ?? '';
    return {
      id: entry.id,
      icon: entry.iconSymbol,
      iconUri,
      webIconUri: entry.iconSourceUri ?? iconUri,
      iconSvg: entry.iconSourceUri ? '' : (entry.rawSvg ?? ''),
      title: entry.title ?? '',
      message: entry.message ?? '',
      duration: entry.duration ?? 3000,
      autoDismiss: entry.autoDismiss ?? true,
      enableSwipeDismiss: entry.enableSwipeDismiss ?? true,
      useDynamicIsland: true,
      accentColor: entry.accentColor,
      strokeColor: entry.strokeColor,
      disableBackdropSampling: entry.disableBackdropSampling ?? false,
      actionLabel: entry.action?.label ?? '',
      accessibilityAnnouncement: getAccessibilityAnnouncement(entry),
    };
  }

  private prepareSvgIcon(entry: ToastEntry): void {
    if (entry.isPreparingSvg || entry.resolvedIconUri) {
      return;
    }

    const needsSvgRaster = Boolean(entry.rawSvg);
    const needsBlobConversion = Boolean(entry.iconSourceUri?.startsWith('blob:'));
    if (!needsSvgRaster && !needsBlobConversion) {
      return;
    }

    entry.isPreparingSvg = true;

    const resolveAsset =
      needsSvgRaster && entry.rawSvg
        ? rasterizeSvgToPngDataUrl(entry.rawSvg)
        : blobUrlToDataUrl(entry.iconSourceUri ?? '');

    void resolveAsset.then((dataUrl) => {
      entry.isPreparingSvg = false;
      if (!dataUrl) return;
      entry.resolvedIconUri = dataUrl;
      if (this.current?.id === entry.id) {
        void this.driver.update(this.buildPayload(entry));
      }
    });
  }

  private generateId(): string {
    this.idCounter += 1;
    return `toast-${this.idCounter}-${Date.now()}`;
  }
}
