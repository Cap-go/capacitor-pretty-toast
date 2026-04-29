import { ToastController } from './controller';
import { CapacitorToastDriver } from './driver';

const controller = new ToastController(new CapacitorToastDriver());

export const toast = controller.ref;
