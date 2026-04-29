import { WebPlugin } from '@capacitor/core';

import type { InternalPrettyToastPlugin, InternalToastPayload } from './internal-types';
import { WebToastRenderer } from './web-renderer';

export class PrettyToastWeb extends WebPlugin implements InternalPrettyToastPlugin {
  private readonly renderer = new WebToastRenderer({
    onDismiss: (id) => {
      this.notifyListeners('toastDismiss', { id });
    },
    onPress: (id) => {
      this.notifyListeners('toastPress', { id });
    },
    onActionPress: (id) => {
      this.notifyListeners('toastActionPress', { id });
    },
  });

  async showCurrentToast(options: InternalToastPayload): Promise<void> {
    this.renderer.show(options);
  }

  async updateCurrentToast(options: InternalToastPayload): Promise<void> {
    this.renderer.update(options);
  }

  async dismissCurrentToast(options?: { id?: string }): Promise<void> {
    this.renderer.dismiss(options?.id);
  }
}
