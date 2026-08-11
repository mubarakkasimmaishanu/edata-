// ─── Android hardware / system Back Button handler stack ───
//
// The app keeps its own `activeView` + `viewHistory` navigation (see
// App.tsx). Screens with internal overlays — a full-screen PIN entry,
// a package-picker modal, a contact-picker modal — live outside that
// history because they're local component state.
//
// When Android fires the hardware back button we want overlays to
// close FIRST (so the user stays on the same page), and only when no
// overlay claims the press do we fall through to the app-level pop.
// This module is the tiny stack that makes that ordering work; App.tsx
// consults it before running the default handler, and overlay owners
// use the `useBackHandler` hook to register while they're open.
//
// Handlers are called LIFO (last opened, first closed) — the same way
// React Native's `BackHandler` behaves, and the same intuition users
// have from the platform.

import { useEffect, useRef } from 'react';

type Handler = () => boolean | void;

const stack: Handler[] = [];

/**
 * Push a raw back handler onto the stack. Returns a removal function.
 * Prefer `useBackHandler` in React components — this is the imperative
 * primitive it's built on.
 *
 * A handler that returns `true` (or nothing) marks the press as
 * consumed. A handler that returns `false` lets the next handler down
 * the stack try.
 */
export function pushBackHandler(fn: Handler): () => void {
  stack.push(fn);
  return () => {
    const i = stack.lastIndexOf(fn);
    if (i >= 0) stack.splice(i, 1);
  };
}

/**
 * Walk the handler stack top-down; returns true as soon as any handler
 * consumes the press. Called by App.tsx from inside the Capacitor
 * `backButton` listener before the default view-history pop.
 */
export function runBackHandlers(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    try {
      const handled = stack[i]();
      if (handled !== false) return true;
    } catch {
      // A broken handler shouldn't strand the user on a page they
      // can't leave — keep walking down the stack.
    }
  }
  return false;
}

/**
 * Register a back-button handler that is active only while `active`
 * is true. Typical use:
 *
 *   useBackHandler(showPinScreen, () => setShowPinScreen(false));
 *
 * The handler always calls the latest closure via a ref, so the
 * component can read fresh state without re-registering on every
 * render (which would race with async listener setup).
 */
export function useBackHandler(active: boolean, handler: () => void) {
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => {
      handlerRef.current();
      return true;
    });
  }, [active]);
}
