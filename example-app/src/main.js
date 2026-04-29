import './styles.css';

import { toast } from '@capgo/capacitor-pretty-toast';

const pageParams = new URLSearchParams(window.location.search);
const activeDemo = pageParams.get('demo');

if (activeDemo) {
  document.body.dataset.demo = activeDemo;
}

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

const ui = {
  duration: document.querySelector('#duration'),
  autoDismiss: document.querySelector('#auto-dismiss'),
  swipeDismiss: document.querySelector('#swipe-dismiss'),
  disableBackdrop: document.querySelector('#disable-backdrop'),
  enableAction: document.querySelector('#enable-action'),
  enablePress: document.querySelector('#enable-press'),
  log: document.querySelector('#log'),
};

const remoteIconUrl = 'https://avatars.githubusercontent.com/u/109134771?s=160&v=4';
const svgIcon = `
<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="toast-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FC5C7D" />
      <stop offset="100%" stop-color="#6A82FB" />
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="76" height="76" rx="24" fill="url(#toast-gradient)" />
  <path d="M29 49.5 42 62l25-28" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="10" />
</svg>
`.trim();

let lastToastId = null;
let loadingToastId = null;

bindEvents();
log('Demo ready');
runAutoplayDemo();

function bindEvents() {
  button('#show-success', () => {
    showSuccessDemo();
  });

  button('#show-promo', () => {
    playPromoMorphDemo();
  });

  button('#show-stage-update', () => {
    playLoadingUpdateDemo({
      loadingTitle: 'Publishing release',
      successTitle: 'Release live',
      successMessage: 'The toast updated in place after the first entrance morph.',
      autoDismiss: true,
      duration: 1600,
      updateDelay: 1500,
    });
  });

  button('#show-error', () => {
    lastToastId = toast.error(
      'Sync failed',
      withSharedConfig({
        message: 'Force a retry or inspect the event log.',
        accentColor: '#FF453A',
      }),
    );
    log(`error: ${lastToastId}`);
  });

  button('#show-info', () => {
    lastToastId = toast.info(
      'Flight mode active',
      withSharedConfig({
        message: 'Toasts still render offline from the local overlay.',
      }),
    );
    log(`info: ${lastToastId}`);
  });

  button('#show-warning', () => {
    lastToastId = toast.warning(
      'Build almost ready',
      withSharedConfig({
        message: 'One last review pass before shipping.',
      }),
    );
    log(`warning: ${lastToastId}`);
  });

  button('#show-loading', () => {
    playLoadingUpdateDemo();
  });

  button('#queue-demo', () => {
    toast.info('Queued first', withSharedConfig({ message: 'Toast one is visible first.' }));
    toast.warning('Queued second', withSharedConfig({ message: 'Toast two waits behind it.' }));
    toast.success('Queued third', withSharedConfig({ message: 'Toast three stays in the FIFO queue.' }));
    log('queued three toasts');
  });

  button('#force-demo', () => {
    const id = toast.show(
      withSharedConfig({
        title: 'Session expiring',
        message: 'This one jumped ahead with force scheduling.',
        icon: 'exclamationmark.triangle.fill',
        accentColor: '#FF9F0A',
      }),
      { force: true },
    );
    lastToastId = id;
    log(`force interrupt: ${id}`);
  });

  button('#update-current', () => {
    if (!lastToastId) {
      lastToastId = toast.info(
        'Seeded current toast',
        withSharedConfig({
          message: 'Press update again to patch this one in place.',
          autoDismiss: false,
        }),
      );
      log(`seeded current toast: ${lastToastId}`);
      return;
    }

    toast.update(lastToastId, {
      title: 'Current toast updated',
      message: 'Queue-safe updates patch the visible or queued toast.',
      strokeColor: '#8DE8FF',
    });
    log(`updated current toast: ${lastToastId}`);
  });

  button('#dismiss-current', () => {
    toast.dismiss();
    log('dismiss current');
  });

  button('#dismiss-all', () => {
    toast.dismissAll();
    log('dismiss all');
  });

  button('#promise-success', async () => {
    const promise = wait(1200).then(() => 'Draft shipped');
    await toast.promise(promise, {
      loading: withSharedConfig({
        title: 'Publishing release notes',
        message: 'The toast will morph when the promise settles.',
      }),
      success: (value) => ({
        title: value,
        message: 'Promise success mapped to a green confirmation toast.',
      }),
      error: 'This should not fail',
    });
    log('promise success resolved');
  });

  button('#promise-error', async () => {
    const promise = wait(1200).then(() => {
      throw new Error('Edge cache not reachable');
    });

    try {
      await toast.promise(promise, {
        loading: withSharedConfig({
          title: 'Refreshing edge cache',
          message: 'This one will flip into an error state.',
        }),
        success: 'Unexpected success',
        error: (error) => ({
          title: 'Cache refresh failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      });
    } catch (error) {
      log(`promise error: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  });

  button('#icon-symbol', () => {
    lastToastId = toast.show(
      withSharedConfig({
        title: 'Mailbox cleared',
        message: 'Using the symbol string path.',
        icon: 'envelope.badge.fill',
      }),
    );
    log(`symbol icon: ${lastToastId}`);
  });

  button('#icon-svg', () => {
    showSvgIconDemo();
  });

  button('#icon-remote', () => {
    lastToastId = toast.show(
      withSharedConfig({
        title: 'Remote image icon',
        message: 'Using URI-only `iconSource`.',
        iconSource: remoteIconUrl,
      }),
    );
    log(`remote icon: ${lastToastId}`);
  });

  button('#icon-data', () => {
    lastToastId = toast.show(
      withSharedConfig({
        title: 'Data URL icon',
        message: 'This exercises a local-style image payload.',
        iconSource: createDataUrlIcon(),
      }),
    );
    log(`data icon: ${lastToastId}`);
  });
}

function showSuccessDemo() {
  lastToastId = toast.success(
    'Profile saved',
    withSharedConfig({
      message: 'The pretty toast core is live in Capacitor.',
    }),
  );
  log(`success: ${lastToastId}`);
}

function showSvgIconDemo() {
  lastToastId = toast.show(
    withSharedConfig({
      title: 'Raw SVG icon',
      message: 'The public API accepts SVG only through `icon`.',
      icon: svgIcon,
    }),
  );
  log(`svg icon: ${lastToastId}`);
}

function playPromoMorphDemo(overrides = {}) {
  lastToastId = toast.show(
    withSharedConfig({
      title: overrides.title ?? 'Release published',
      message: overrides.message ?? 'Anchored motion from the top cutout, then a clean fold back out.',
      icon: overrides.icon ?? 'paperplane.circle.fill',
      accentColor: overrides.accentColor ?? '#8DE8FF',
      autoDismiss: overrides.autoDismiss ?? true,
      duration: overrides.duration ?? 1800,
      enableSwipeDismiss: overrides.enableSwipeDismiss ?? false,
      action: overrides.action,
      onPress: overrides.onPress,
    }),
  );
  log(`promo morph: ${lastToastId}`);
}

function playLoadingUpdateDemo(overrides = {}) {
  const loadingConfig = {
    ...withSharedConfig({
      message: 'The loading toast stays visible until it is updated.',
      autoDismiss: false,
    }),
    ...(overrides.loading ?? {}),
  };

  loadingToastId = toast.loading(overrides.loadingTitle ?? 'Uploading assets', loadingConfig);
  log(`loading: ${loadingToastId}`);

  setTimeout(() => {
    if (!loadingToastId) return;
    toast.update(loadingToastId, {
      title: overrides.successTitle ?? 'Upload complete',
      message: overrides.successMessage ?? 'The same toast instance was updated in place.',
      icon: overrides.successIcon ?? 'checkmark.circle.fill',
      autoDismiss: overrides.autoDismiss ?? true,
      duration: overrides.duration ?? Number(ui.duration.value),
    });
    log(`updated loading toast: ${loadingToastId}`);
  }, overrides.updateDelay ?? 1800);
}

function runAutoplayDemo() {
  if (!activeDemo) return;

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  if (activeDemo === 'hero') {
    setTimeout(() => {
      lastToastId = toast.show(
        withSharedConfig({
          title: 'Capgo pretty toast',
          message: 'Native island-style motion with SVG and action support.',
          icon: svgIcon,
          autoDismiss: false,
          action: {
            label: 'Try it',
            onPress: () => log('hero action pressed'),
          },
        }),
      );
      log(`hero demo: ${lastToastId}`);
    }, 180);
  }

  if (activeDemo === 'flow') {
    setTimeout(() => {
      playPromoMorphDemo({
        title: 'Release published',
        message: 'The promo route now shows the full entrance and exit morph.',
        duration: 1800,
        autoDismiss: true,
        enableSwipeDismiss: false,
      });
    }, 180);
  }

  if (activeDemo === 'update') {
    setTimeout(() => {
      playLoadingUpdateDemo({
        loadingTitle: 'Publishing release',
        successTitle: 'Release live',
        successMessage: 'The toast morphed in place from loading to success.',
        autoDismiss: true,
        duration: 1400,
        updateDelay: 1600,
      });
    }, 180);
  }
}

function withSharedConfig(overrides = {}) {
  const duration = Number(ui.duration.value) || 0;
  const autoDismiss = ui.autoDismiss.checked;
  const enableSwipeDismiss = ui.swipeDismiss.checked;
  const disableBackdropSampling = ui.disableBackdrop.checked;
  const action = ui.enableAction.checked
    ? {
        label: 'Undo',
        onPress: () => log('action pressed'),
      }
    : undefined;
  const onPress = ui.enablePress.checked
    ? () => log('toast tapped')
    : undefined;

  return {
    duration,
    autoDismiss,
    enableSwipeDismiss,
    disableBackdropSampling,
    action,
    onPress,
    onShow: () => log('toast shown'),
    onHide: () => log('toast hidden'),
    onAutoDismiss: () => log('toast auto-dismissed'),
    ...overrides,
  };
}

function createDataUrlIcon() {
  const canvas = document.createElement('canvas');
  canvas.width = 72;
  canvas.height = 72;
  const context = canvas.getContext('2d');
  if (!context) {
    return remoteIconUrl;
  }

  context.clearRect(0, 0, 72, 72);
  context.fillStyle = '#151517';
  context.beginPath();
  context.roundRect(4, 4, 64, 64, 20);
  context.fill();

  context.fillStyle = '#8DE8FF';
  context.beginPath();
  context.arc(36, 36, 18, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#0D1A3A';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(36, 20);
  context.lineTo(36, 52);
  context.moveTo(20, 36);
  context.lineTo(52, 36);
  context.stroke();

  return canvas.toDataURL('image/png');
}

function button(selector, handler) {
  document.querySelector(selector)?.addEventListener('click', handler);
}

function log(message) {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString()}  ${message}`;
  ui.log.prepend(item);

  while (ui.log.children.length > 16) {
    ui.log.lastElementChild?.remove();
  }
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
