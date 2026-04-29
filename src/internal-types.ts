import type { PluginListenerHandle } from '@capacitor/core';

export interface InternalToastPayload {
  id: string;
  icon: string;
  iconUri: string;
  webIconUri: string;
  iconSvg: string;
  title: string;
  message: string;
  duration: number;
  autoDismiss: boolean;
  enableSwipeDismiss: boolean;
  useDynamicIsland: boolean;
  accentColor?: string;
  strokeColor?: string;
  disableBackdropSampling: boolean;
  actionLabel: string;
  accessibilityAnnouncement: string;
}

export interface ToastBridgeEvent {
  id: string;
}

export interface InternalPrettyToastPlugin {
  showCurrentToast(options: InternalToastPayload): Promise<void>;
  updateCurrentToast(options: InternalToastPayload): Promise<void>;
  dismissCurrentToast(options?: { id?: string }): Promise<void>;
  addListener(
    eventName: 'toastDismiss' | 'toastPress' | 'toastActionPress',
    listenerFunc: (event: ToastBridgeEvent) => void,
  ): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
}
