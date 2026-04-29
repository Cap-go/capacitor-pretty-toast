import { PrettyToastBridge } from './internal-plugin';
import type { ToastBridgeEvent, InternalToastPayload } from './internal-types';

export interface ToastDriverEvents {
  onDismiss: (event: ToastBridgeEvent) => void;
  onPress: (event: ToastBridgeEvent) => void;
  onActionPress: (event: ToastBridgeEvent) => void;
}

export interface ToastDriver {
  subscribe: (events: ToastDriverEvents) => void;
  show: (payload: InternalToastPayload) => Promise<void> | void;
  update: (payload: InternalToastPayload) => Promise<void> | void;
  dismiss: (id?: string) => Promise<void> | void;
}

export class CapacitorToastDriver implements ToastDriver {
  private subscribed = false;

  subscribe(events: ToastDriverEvents): void {
    if (this.subscribed) return;
    this.subscribed = true;
    void PrettyToastBridge.addListener('toastDismiss', events.onDismiss);
    void PrettyToastBridge.addListener('toastPress', events.onPress);
    void PrettyToastBridge.addListener('toastActionPress', events.onActionPress);
  }

  show(payload: InternalToastPayload): Promise<void> {
    return PrettyToastBridge.showCurrentToast(payload);
  }

  update(payload: InternalToastPayload): Promise<void> {
    return PrettyToastBridge.updateCurrentToast(payload);
  }

  dismiss(id?: string): Promise<void> {
    return PrettyToastBridge.dismissCurrentToast(id ? { id } : {});
  }
}
