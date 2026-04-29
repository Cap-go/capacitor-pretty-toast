import { registerPlugin } from '@capacitor/core';

import type { InternalPrettyToastPlugin } from './internal-types';

export const PrettyToastBridge = registerPlugin<InternalPrettyToastPlugin>('PrettyToast', {
  web: () => import('./web').then((module) => new module.PrettyToastWeb()),
});
