import type { InputManager } from './InputManager';

/**
 * Maps on-screen touch buttons to key codes for mobile. Renders nothing to the
 * game canvas — it overlays lightweight HTML buttons so touch targets are large
 * and OS-accelerated. Auto-shows only on touch-capable devices.
 *
 * Extension point: pass a different key list to remap columns.
 */
export class TouchAdapter {
  private readonly root: HTMLDivElement;

  constructor(input: InputManager, keys: string[], extra: string[] = ['enter']) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      display: this.isTouch() ? 'flex' : 'none',
      justifyContent: 'center',
      gap: '6px',
      padding: '10px',
      zIndex: '10',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);

    const makeButton = (key: string, label: string) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        flex: '1',
        maxWidth: '13%',
        minHeight: '64px',
        fontFamily: 'monospace',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#3E2723',
        background: '#FFB74D',
        border: '2px solid #3E2723',
        borderRadius: '8px',
        pointerEvents: 'auto',
        touchAction: 'none',
        userSelect: 'none',
      } satisfies Partial<CSSStyleDeclaration>);
      const press = (e: Event) => {
        e.preventDefault();
        input.injectPress(key);
      };
      b.addEventListener('touchstart', press, { passive: false });
      b.addEventListener('mousedown', press);
      return b;
    };

    for (const k of keys) this.root.appendChild(makeButton(k, k.toUpperCase()));
    for (const k of extra) {
      const b = makeButton(k, k === 'enter' ? 'OK' : k.toUpperCase());
      b.style.maxWidth = '20%';
      this.root.appendChild(b);
    }

    document.body.appendChild(this.root);
  }

  private isTouch(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
