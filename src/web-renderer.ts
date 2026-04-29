import { DEFAULT_ICON_SYMBOL, getSymbolIcon, parseSvgElement } from './icons';
import type { InternalToastPayload } from './internal-types';

const ENTER_MS = 450;
const EXIT_MS = 350;
const ENTER_EASING = 'cubic-bezier(0.22, 1.2, 0.36, 1)';
const EXIT_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const SWIPE_THRESHOLD = -40;

interface WebToastRendererEvents {
  onDismiss: (id: string) => void;
  onPress: (id: string) => void;
  onActionPress: (id: string) => void;
}

export class WebToastRenderer {
  private current: InternalToastPayload | null = null;
  private root: HTMLDivElement | null = null;
  private iconSlot: HTMLDivElement | null = null;
  private titleNode: HTMLDivElement | null = null;
  private messageNode: HTMLDivElement | null = null;
  private actionButton: HTMLButtonElement | null = null;
  private autoDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private exitTimer: ReturnType<typeof setTimeout> | null = null;
  private prefersDark = false;
  private dragStartY: number | null = null;
  private dragY = 0;
  private isDragging = false;

  constructor(private readonly events: WebToastRendererEvents) {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }

  show(payload: InternalToastPayload): void {
    this.current = payload;
    this.clearExitTimer();
    this.clearAutoDismissTimer();
    this.dragStartY = null;
    this.dragY = 0;
    this.isDragging = false;
    this.ensureElements();
    this.render(payload);
    this.applyEnteringState();
    requestAnimationFrame(() => {
      if (!this.root || this.current?.id !== payload.id) return;
      this.root.style.transform = 'translate(-50%, 0) scale(1)';
      this.root.style.opacity = '1';
    });
    this.armAutoDismiss(payload);
  }

  update(payload: InternalToastPayload): void {
    if (!this.root || !this.current || this.current.id !== payload.id) return;
    this.current = payload;
    this.render(payload);
    this.armAutoDismiss(payload);
  }

  dismiss(id?: string): void {
    if (!this.current || (id && this.current.id !== id) || !this.root) return;
    this.clearAutoDismissTimer();
    this.startExit();
  }

  private ensureElements(): void {
    if (typeof document === 'undefined') return;
    if (this.root) {
      if (!this.root.isConnected) {
        document.body.appendChild(this.root);
      }
      return;
    }

    const root = document.createElement('div');
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.style.position = 'fixed';
    root.style.top = 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 10px)';
    root.style.left = '50%';
    root.style.zIndex = '2147483647';
    root.style.width = 'min(360px, calc(100vw - 20px))';
    root.style.boxSizing = 'border-box';
    root.style.background = '#000';
    root.style.borderRadius = '30px';
    root.style.padding = '14px 20px';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.gap = '10px';
    root.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    root.style.userSelect = 'none';
    root.style.touchAction = 'none';
    root.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
    root.style.transform = 'translate(-50%, -40px) scale(0.8)';
    root.style.opacity = '0';
    root.style.transition = `transform ${ENTER_MS}ms ${ENTER_EASING}, opacity ${ENTER_MS}ms ${ENTER_EASING}`;

    root.addEventListener('pointerdown', (event) => this.handlePointerDown(event));
    root.addEventListener('pointermove', (event) => this.handlePointerMove(event));
    root.addEventListener('pointerup', (event) => this.handlePointerUp(event));
    root.addEventListener('pointercancel', (event) => this.handlePointerUp(event));
    root.addEventListener('click', () => {
      if (!this.current || this.dragY < -4) return;
      this.events.onPress(this.current.id);
    });

    const iconSlot = document.createElement('div');
    iconSlot.style.width = '50px';
    iconSlot.style.flexShrink = '0';
    iconSlot.style.display = 'flex';
    iconSlot.style.alignItems = 'center';
    iconSlot.style.justifyContent = 'center';
    iconSlot.style.fontSize = '35px';
    iconSlot.style.lineHeight = '1';

    const textWrap = document.createElement('div');
    textWrap.style.flex = '1';
    textWrap.style.minWidth = '0';

    const titleNode = document.createElement('div');
    titleNode.style.color = '#fff';
    titleNode.style.fontWeight = '600';
    titleNode.style.fontSize = '15px';
    titleNode.style.lineHeight = '20px';
    titleNode.style.wordBreak = 'break-word';

    const messageNode = document.createElement('div');
    messageNode.style.color = 'rgba(255, 255, 255, 0.6)';
    messageNode.style.fontSize = '12px';
    messageNode.style.lineHeight = '16px';
    messageNode.style.wordBreak = 'break-word';

    textWrap.appendChild(titleNode);
    textWrap.appendChild(messageNode);

    const actionButton = document.createElement('button');
    actionButton.type = 'button';
    actionButton.style.flexShrink = '0';
    actionButton.style.marginLeft = '4px';
    actionButton.style.padding = '6px 12px';
    actionButton.style.background = 'rgba(255,255,255,0.12)';
    actionButton.style.border = 'none';
    actionButton.style.borderRadius = '999px';
    actionButton.style.fontSize = '13px';
    actionButton.style.fontWeight = '600';
    actionButton.style.cursor = 'pointer';
    actionButton.style.display = 'none';
    actionButton.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!this.current) return;
      this.events.onActionPress(this.current.id);
    });
    actionButton.addEventListener('pointerdown', (event) => event.stopPropagation());

    root.appendChild(iconSlot);
    root.appendChild(textWrap);
    root.appendChild(actionButton);
    document.body.appendChild(root);

    this.root = root;
    this.iconSlot = iconSlot;
    this.titleNode = titleNode;
    this.messageNode = messageNode;
    this.actionButton = actionButton;
  }

  private render(payload: InternalToastPayload): void {
    if (!this.root || !this.iconSlot || !this.titleNode || !this.messageNode || !this.actionButton) {
      return;
    }

    const symbolInfo = getSymbolIcon(payload.icon);
    const accentColor = payload.accentColor ?? symbolInfo.color;
    const outline = payload.strokeColor
      ? payload.strokeColor
      : payload.disableBackdropSampling
        ? 'rgba(255,255,255,0.06)'
        : this.prefersDark
          ? `color-mix(in srgb, ${accentColor} 20%, transparent)`
          : '';

    this.root.style.border = outline ? `2px solid ${outline}` : 'none';
    this.root.style.cursor = payload.actionLabel || payload.icon ? 'pointer' : 'default';
    this.root.setAttribute('aria-label', payload.accessibilityAnnouncement || '');

    this.iconSlot.style.color = accentColor;
    this.iconSlot.replaceChildren();

    const renderableUri = payload.webIconUri || payload.iconUri;

    if (renderableUri) {
      const image = document.createElement('img');
      image.src = renderableUri;
      image.alt = '';
      image.style.width = '40px';
      image.style.height = '40px';
      image.style.objectFit = 'contain';
      this.iconSlot.appendChild(image);
    } else if (payload.iconSvg) {
      const svg = parseSvgElement(payload.iconSvg);
      if (svg) {
        this.iconSlot.appendChild(svg);
      } else {
        this.iconSlot.textContent = getSymbolIcon(payload.icon || DEFAULT_ICON_SYMBOL).glyph ?? '';
      }
    } else {
      const glyph = symbolInfo.glyph ?? getSymbolIcon(DEFAULT_ICON_SYMBOL).glyph;
      if (glyph) {
        this.iconSlot.textContent = glyph;
      } else {
        this.iconSlot.innerHTML =
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.25a1 1 0 0 1 1 1v.6a7 7 0 0 1 6 6.93v3.36l1.38 2.07A1.25 1.25 0 0 1 19.34 18H4.66a1.25 1.25 0 0 1-1.04-1.94L5 14v-3.22a7 7 0 0 1 6-6.93v-.6a1 1 0 0 1 1-1Zm-2.5 17.25a2.5 2.5 0 0 0 5 0h-5Z" /></svg>';
      }
    }

    this.titleNode.textContent = payload.title;
    this.titleNode.style.display = payload.title ? 'block' : 'none';

    this.messageNode.textContent = payload.message;
    this.messageNode.style.display = payload.message ? 'block' : 'none';
    this.messageNode.style.marginTop = payload.title && payload.message ? '4px' : '0';

    this.actionButton.textContent = payload.actionLabel;
    this.actionButton.style.color = accentColor;
    this.actionButton.style.display = payload.actionLabel ? 'inline-flex' : 'none';
  }

  private armAutoDismiss(payload: InternalToastPayload): void {
    this.clearAutoDismissTimer();
    if (!payload.autoDismiss || payload.duration <= 0) return;
    this.autoDismissTimer = setTimeout(() => {
      this.startExit();
    }, payload.duration);
  }

  private startExit(): void {
    if (!this.root || !this.current || this.exitTimer) return;
    const currentId = this.current.id;
    this.root.style.transition = `transform ${EXIT_MS}ms ${EXIT_EASING}, opacity ${EXIT_MS}ms ${EXIT_EASING}`;
    this.root.style.transform = `translate(-50%, ${this.dragY - 40}px) scale(1)`;
    this.root.style.opacity = '0';
    this.exitTimer = setTimeout(() => {
      this.exitTimer = null;
      this.clearAutoDismissTimer();
      this.dragY = 0;
      this.isDragging = false;
      this.dragStartY = null;
      if (this.root?.isConnected) {
        this.root.remove();
      }
      this.root = null;
      this.iconSlot = null;
      this.titleNode = null;
      this.messageNode = null;
      this.actionButton = null;
      this.current = null;
      this.events.onDismiss(currentId);
    }, EXIT_MS);
  }

  private applyEnteringState(): void {
    if (!this.root) return;
    this.root.style.transition = `transform ${ENTER_MS}ms ${ENTER_EASING}, opacity ${ENTER_MS}ms ${ENTER_EASING}`;
    this.root.style.transform = 'translate(-50%, -40px) scale(0.8)';
    this.root.style.opacity = '0';
  }

  private handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.dragStartY = event.clientY;
    this.dragY = 0;
    this.root?.setPointerCapture?.(event.pointerId);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.root || this.dragStartY === null) return;
    const nextDragY = Math.min(0, event.clientY - this.dragStartY);
    this.dragY = nextDragY;
    this.isDragging = nextDragY < -2;
    if (!this.isDragging) return;
    this.root.style.transition = 'none';
    this.root.style.transform = `translate(-50%, ${nextDragY}px) scale(1)`;
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.root || this.dragStartY === null) return;
    this.dragStartY = null;
    this.root.releasePointerCapture?.(event.pointerId);
    if (this.dragY < SWIPE_THRESHOLD) {
      this.startExit();
      return;
    }
    this.isDragging = false;
    this.dragY = 0;
    this.root.style.transition = `transform ${EXIT_MS}ms ${EXIT_EASING}, opacity ${EXIT_MS}ms ${EXIT_EASING}`;
    this.root.style.transform = 'translate(-50%, 0) scale(1)';
  }

  private clearAutoDismissTimer(): void {
    if (!this.autoDismissTimer) return;
    clearTimeout(this.autoDismissTimer);
    this.autoDismissTimer = null;
  }

  private clearExitTimer(): void {
    if (!this.exitTimer) return;
    clearTimeout(this.exitTimer);
    this.exitTimer = null;
  }
}
