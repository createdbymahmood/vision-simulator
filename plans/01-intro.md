# Computer Vision Simulator — Introduction

## What Is This App?

The **Computer Vision Simulator** is an interactive simulation tool for designing and testing security camera setups. Users design environments in a 2D editor, place cameras and people, then run a live simulation that shows exactly what each camera can see — including realistic occlusion, blind spots, and moving targets.

This is not a diagram editor. It's a **realistic security camera simulation** that behaves like actual CCTV systems.

---

## Core User Flow

```
Design → Place → Simulate → Export
```

1. **Design an environment** using either:

   - **Canvas Editor** — grid-based 2D board
   - **Map Editor** — real-world locations via Mapbox

2. **Place objects** in the scene:

   - Walls and shapes (obstacles)
   - Security cameras (with configurable FOV, depth, height, zoom)
   - People (agents that will move during simulation)
   - Background images (for Canvas)
   - Areas (for Map — define operational zones)

3. **Run the simulation** and observe:

   - Real-time 3D world with people moving and avoiding obstacles
   - Live camera POV feeds (CCTV-style tiles)
   - Visibility detection with bounding boxes on detected people
   - Optional 2D top-down view

4. **Export results**:
   - Video recording of the simulation
   - Snapshot images
   - Scene JSON for integration with other systems

---

## Two Editor Modes

### Canvas Editor

A grid-based 2D editor for designing abstract or indoor environments.

- Free-form placement anywhere on the board
- Background image support for overlaying floor plans
- Best for: indoor layouts, conceptual designs, floor plan analysis

### Map Editor

A geo-referenced editor using real-world maps.

- All objects must be placed within defined "areas"
- Uses Mapbox for satellite/street/traffic views
- Best for: outdoor installations, campus layouts, real-world site planning

---

## The Simulation Experience

When you hit **Live Preview**, the app transforms your 2D design into:

### 3D World View

- Walls and shapes extruded to their configured heights
- People rendered as 3D figures walking around
- Cameras visible as physical devices
- Orbit controls to explore the scene from any angle

### Camera POV Feeds

- Each camera renders its own perspective (like CCTV monitors)
- Bounding boxes appear around detected people
- Visibility respects obstacles, height, FOV, and depth

### People Movement

- Agents move autonomously avoiding walls and each other
- Click a person to see their movement trail
- Collision detection prevents unrealistic behavior

---

## What Makes It "Realistic"

1. **Occlusion-aware visibility** — Cameras can't see through walls. Vision cones are computed with ray casting.

2. **Height matters** — A short obstacle won't block a camera looking at a tall person behind it.

3. **True camera frustum** — FOV, depth, zoom, and near clipping all affect what's visible.

4. **Actual CCTV feeds** — Each camera renders its own 3D view, not just an approximation.

5. **Physics-based movement** — People navigate around obstacles realistically, never teleporting through walls.

---

## Who Is This For?

| Persona                   | Use Case                                                      |
| ------------------------- | ------------------------------------------------------------- |
| **Security Designer**     | Plan camera placement, identify blind spots and coverage gaps |
| **Operations Engineer**   | Validate device constraints in real environments              |
| **Analyst / Stakeholder** | Review recorded simulations and snapshots                     |
| **Integrator**            | Export scene JSON for use in other systems                    |

---

## Primary Job-to-be-Done

> "When I design an environment, I want to see which people each camera can detect, so I can validate camera placement and configuration before deployment."

---

## Platform

- **Web application** (desktop-first)
- No backend required — everything runs in the browser
- Scene data persists in local storage with JSON export option
