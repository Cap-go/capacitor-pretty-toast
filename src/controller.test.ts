import { describe, expect, test } from 'bun:test';

import { ToastController } from './controller';
import type { ToastDriver, ToastDriverEvents } from './driver';
import type { InternalToastPayload } from './internal-types';

class FakeDriver implements ToastDriver {
  events: ToastDriverEvents | null = null;
  showCalls: InternalToastPayload[] = [];
  updateCalls: InternalToastPayload[] = [];
  dismissCalls: (string | undefined)[] = [];

  subscribe(events: ToastDriverEvents): void {
    this.events = events;
  }

  show(payload: InternalToastPayload): void {
    this.showCalls.push(payload);
  }

  update(payload: InternalToastPayload): void {
    this.updateCalls.push(payload);
  }

  dismiss(id?: string): void {
    this.dismissCalls.push(id);
  }
}

describe('ToastController', () => {
  test('shows and dismisses a toast with callbacks', () => {
    const driver = new FakeDriver();
    const controller = new ToastController(driver);
    const events: string[] = [];

    const id = controller.ref.show({
      title: 'Saved',
      onShow: () => events.push('show'),
      onHide: () => events.push('hide'),
    });

    expect(id).toMatch(/^toast-/);
    expect(driver.showCalls).toHaveLength(1);
    expect(driver.showCalls[0]?.title).toBe('Saved');
    expect(events).toEqual(['show']);

    driver.events?.onDismiss({ id });
    expect(events).toEqual(['show', 'hide']);
  });

  test('force dismisses the current toast and promotes the queued one', () => {
    const driver = new FakeDriver();
    const controller = new ToastController(driver);

    const firstId = controller.ref.show({ title: 'First' });
    const secondId = controller.ref.show({ title: 'Second' }, { force: true });

    expect(driver.dismissCalls).toEqual([firstId]);
    expect(driver.showCalls).toHaveLength(1);

    driver.events?.onDismiss({ id: firstId });

    expect(driver.showCalls).toHaveLength(2);
    expect(driver.showCalls[1]?.id).toBe(secondId);
    expect(driver.showCalls[1]?.title).toBe('Second');
  });

  test('promise updates loading toast into success state', async () => {
    const driver = new FakeDriver();
    const controller = new ToastController(driver);
    const promise = Promise.resolve('ok');

    await controller.ref.promise(promise, {
      loading: 'Loading',
      success: (value) => ({ title: `Done ${value}` }),
      error: 'Nope',
    });

    expect(driver.showCalls).toHaveLength(1);
    expect(driver.showCalls[0]?.title).toBe('Loading');
    expect(driver.updateCalls).toHaveLength(1);
    expect(driver.updateCalls[0]?.title).toBe('Done ok');
    expect(driver.updateCalls[0]?.icon).toContain('checkmark');
  });

  test('iconSource takes precedence over icon svg markup', () => {
    const driver = new FakeDriver();
    const controller = new ToastController(driver);

    controller.ref.show({
      title: 'Image first',
      icon: '<svg viewBox="0 0 10 10"></svg>',
      iconSource: 'https://example.com/icon.png',
    });

    expect(driver.showCalls).toHaveLength(1);
    expect(driver.showCalls[0]?.iconUri).toBe('https://example.com/icon.png');
    expect(driver.showCalls[0]?.iconSvg).toBe('');
  });

  test('auto dismiss callback fires when timer elapsed before dismiss event', async () => {
    const driver = new FakeDriver();
    const controller = new ToastController(driver);
    const events: string[] = [];

    const id = controller.ref.show({
      title: 'Timed',
      duration: 5,
      onAutoDismiss: () => events.push('auto'),
      onHide: () => events.push('hide'),
    });

    await new Promise((resolve) => setTimeout(resolve, 15));
    driver.events?.onDismiss({ id });

    expect(events).toEqual(['auto', 'hide']);
  });
});
