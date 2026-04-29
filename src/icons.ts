import type { IconSource, ToastConfig } from './definitions';

export interface SymbolIconInfo {
  glyph: string | null;
  color: string;
}

const ICON_MAP: [string, SymbolIconInfo][] = [
  ['checkmark', { glyph: '✓', color: '#30D158' }],
  ['xmark', { glyph: '✕', color: '#FF453A' }],
  ['info', { glyph: 'ℹ', color: '#0A84FF' }],
  ['exclamation', { glyph: '!', color: '#FF9F0A' }],
  ['heart', { glyph: '♥', color: '#FF375F' }],
  ['arrow.up', { glyph: '↑', color: '#0A84FF' }],
  ['arrow.down', { glyph: '↓', color: '#0A84FF' }],
  ['arrow', { glyph: '↑', color: '#0A84FF' }],
  ['envelope', { glyph: '✉', color: '#FFFFFF' }],
  ['mail', { glyph: '✉', color: '#FFFFFF' }],
  ['wifi', { glyph: '◉', color: '#FFFFFF' }],
];

export const DEFAULT_ICON_SYMBOL = 'bell.badge.fill';

const svgRasterCache = new Map<string, Promise<string | null>>();

export function isSvgIcon(value: string | undefined): boolean {
  return typeof value === 'string' && value.trimStart().startsWith('<svg');
}

export function normalizeIconSource(source: IconSource | undefined): string | undefined {
  if (!source) return undefined;
  if (typeof source === 'string') {
    return source.trim() || undefined;
  }
  if (typeof source.uri === 'string') {
    return source.uri.trim() || undefined;
  }
  return undefined;
}

export function getSymbolIcon(symbol: string | undefined): SymbolIconInfo {
  const normalized = symbol ?? '';
  for (const [key, info] of ICON_MAP) {
    if (normalized.includes(key)) return info;
  }
  return { glyph: null, color: '#FFFFFF' };
}

export function getAccessibilityAnnouncement(
  config: Pick<ToastConfig, 'accessibilityAnnouncement' | 'title' | 'message'>,
): string {
  if (config.accessibilityAnnouncement !== undefined) {
    return config.accessibilityAnnouncement;
  }
  return [config.title, config.message].filter(Boolean).join('. ');
}

export function isNativeSafeIconUri(uri: string | undefined): boolean {
  if (!uri) return false;
  return (
    uri.startsWith('https://') ||
    uri.startsWith('http://') ||
    uri.startsWith('file://') ||
    uri.startsWith('data:') ||
    uri.startsWith('/')
  );
}

export async function rasterizeSvgToPngDataUrl(svg: string): Promise<string | null> {
  let pending = svgRasterCache.get(svg);
  if (!pending) {
    pending = rasterizeSvgToPngDataUrlInternal(svg);
    svgRasterCache.set(svg, pending);
  }
  return pending;
}

export async function blobUrlToDataUrl(uri: string): Promise<string | null> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined' || typeof FileReader === 'undefined') {
    return null;
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function rasterizeSvgToPngDataUrlInternal(svg: string): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  const encodedSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const sourceWidth = image.naturalWidth || 96;
        const sourceHeight = image.naturalHeight || 96;
        const maxSide = Math.max(sourceWidth, sourceHeight, 1);
        const scale = 128 / maxSide;
        const width = Math.max(1, Math.round(sourceWidth * scale));
        const height = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(null);
          return;
        }
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = encodedSvg;
  });
}

export function parseSvgElement(svgMarkup: string): SVGSVGElement | null {
  if (typeof DOMParser === 'undefined') return null;
  try {
    const documentNode = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
    if (documentNode.querySelector('parsererror') || documentNode.querySelector('script')) {
      return null;
    }
    const root = documentNode.documentElement;
    if (!root || root.tagName.toLowerCase() !== 'svg') return null;
    const svg = root.cloneNode(true) as SVGSVGElement;
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.display = 'block';
    return svg;
  } catch {
    return null;
  }
}
