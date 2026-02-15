# Shadow DOM + Portal Dropdown Integration Guide

This guide explains how dropdown/portal positioning behaves in this project, what the host app can still influence, and how to keep placement stable in production embeds.

## Scope

This document is specific to the current implementation in:

- `src/app.tsx`
- `src/lib/portal-container.tsx`
- `src/components/ui/dropdown-menu.tsx`

## Executive Summary

Shadow DOM in this project isolates styles well, but it does **not** fully isolate layout geometry.  
Dropdown placement can still shift if the host app changes geometry around the shadow host (transforms, zoom, clipping, scroll context, iframe context, or blocked resize/scroll propagation).

## How Your Current Implementation Works

1. The app defaults to `isolationMode='shadow'` in `src/app.tsx`.
2. A host element is rendered:
   - `<div data-slot="vision-simulator-shadow-host" ... />`
3. `useOpenShadowRoot` creates/reuses `host.attachShadow({mode: 'open'})`.
4. The app shell is portaled into the shadow root with `createPortal(...)`.
5. `PortalContainerProvider` sets the portal container to:
   - `shadowRoot` when `isolationMode='shadow'`
   - `null` when `isolationMode='none'`
6. Dropdowns use `DropdownMenuPrimitive.Portal` with:
   - `container={resolvePortalContainer(container, portalContainer)}`
   - This means dropdown content follows the context container (shadow root in shadow mode).

## What Shadow DOM Protects vs. What It Does Not

### Protected (mostly)

- Host CSS selector leakage into your internal component classes.
- Host style collisions on your dropdown/content internals.

### Not Protected

- Coordinate space and geometry calculations.
- Viewport and scroll math.
- Ancestor transforms/zoom/clipping behavior.
- Iframe embedding side effects.
- Event flow side effects that affect reposition logic.

## Can Host Interference Change Dropdown Placement?

Yes. It is possible and common in embedded widgets.

Even when dropdown markup is inside shadow root, placement math still depends on the rendered geometry of the host and surrounding layout tree.

## Host Interference Matrix

### 1. Transforms/Zoom/Perspective on Host Ancestors

Risk:

- `transform`, `scale`, `zoom`, `perspective`, `filter` on the host or ancestors can offset floating UI calculations.

Symptoms:

- Dropdown appears shifted from trigger.
- Misalignment changes when page zoom or responsive breakpoints change.

### 2. Clipping and Overflow

Risk:

- `overflow: hidden` / `clip` on ancestors can cut off dropdown content.

Symptoms:

- Menu opens but gets visually truncated.
- Correct anchor point but clipped panel.

### 3. Nested Scroll Containers

Risk:

- Unexpected scroll parents change available viewport area and collision behavior.

Symptoms:

- Dropdown flips to wrong side unexpectedly.
- Position updates lag during scroll.

### 4. Stacking Contexts / z-index Context Breaks

Risk:

- New stacking contexts on ancestors can cause layering anomalies.

Symptoms:

- Dropdown appears behind unrelated host elements.

### 5. Iframe Embedding

Risk:

- Coordinate calculations happen within iframe document context; host iframe scaling or scrolling still affects behavior.

Symptoms:

- Works standalone, shifts when embedded in iframe shell.

### 6. Global Event Interference

Risk:

- Aggressive global listeners that stop propagation or aggressively mutate layout on scroll/resize can interfere with reposition cycles.

Symptoms:

- Dropdown aligns initially, drifts after scroll/resize.

## Host Integration Contract (Recommended)

The embedding app should follow these rules where your widget is mounted:

1. Do not apply transforms or zoom to the shadow host or any ancestor.
2. Avoid clipping ancestors around the mount area.
3. Keep layout stable while overlays are open.
4. Do not block scroll/resize/pointer event flow globally.
5. Keep z-index/stacking context behavior predictable.

Minimal baseline CSS for the host mount:

```css
[data-slot='vision-simulator-shadow-host'] {
  position: relative;
  overflow: visible;
}
```

Parent container guidance:

```css
.vision-simulator-embed-wrapper {
  transform: none;
  perspective: none;
  filter: none;
  zoom: 1;
  overflow: visible;
}
```

## Isolation Mode Decision Guide

### Use `isolationMode='shadow'` when

- You need strong style isolation from host CSS.
- Host page does not apply problematic transforms/zoom/clipping around the widget.

### Use `isolationMode='none'` when

- Host layout constraints cannot be changed.
- You need overlay behavior to align with host document body portal expectations.

Current switch location:

- `src/app.tsx` (`isolationMode` branch in `App`)

## Troubleshooting Playbook

### Step 1: Confirm Mode

- Verify whether the app runs in `shadow` or `none`.

### Step 2: Inspect Ancestor Chain

From the host element up to `html`, inspect computed styles for:

- `transform`
- `zoom`
- `perspective`
- `filter`
- `overflow`
- `position`

### Step 3: Reproduce with Host Constraints Removed

Temporarily disable suspicious ancestor styles in DevTools.  
If alignment returns, host geometry is the root cause.

### Step 4: Verify Clipping vs. Misalignment

- Misalignment: anchor math issue.
- Clipping: overflow/container issue.

Treat them separately.

### Step 5: Toggle Fallback

Switch to `isolationMode='none'` and re-test.  
If issue disappears, the problem is container/geometry interaction in shadow embedding context.

## Regression Test Checklist

Run this checklist in every host environment:

1. Open dropdown near top/middle/bottom of viewport.
2. Open dropdown near left/right edges.
3. Scroll parent containers and window while menu is open.
4. Resize viewport while menu is open.
5. Test at browser zoom levels (90%, 100%, 110%).
6. Test inside iframe embedding scenario (if used).
7. Confirm menu stays above neighboring host content.
8. Confirm no clipping in constrained layouts.

## Common Symptoms -> Likely Cause

- Offset that scales with zoom: ancestor `zoom`/transform.
- Correct anchor but cut menu: overflow clipping.
- Works in standalone app but not host shell: host container styles or iframe effects.
- Wrong layer order: stacking context/z-index mismatch.

## Practical Mitigations

1. Prefer a dedicated, style-stable mount region in the host page.
2. Remove transform/zoom from the widget ancestor chain.
3. Keep overflow visible around interactive overlay regions.
4. Use `isolationMode='none'` when host restrictions are non-negotiable.
5. Add embed integration tests in the host app (not only in local standalone app).

## Notes for Future Hardening

- Document the host contract in public integration docs.
- Add an environment diagnostic utility that logs problematic ancestor styles.
- Consider runtime warnings when host ancestry includes known risky styles.

