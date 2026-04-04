# Scenarios

Scenarios are end-to-end walkthroughs that mirror real use cases. Each one starts in the Editor and finishes in Simulation Analysis so you can confirm the result visually.

## Scenario: Retail Store Camera Coverage

**Goal:** Model a small retail store, place cameras to cover the entrance and checkout, then verify coverage in Simulation Analysis.

**Step 1:** Open the Editor View. In the top-left, choose **Map** or **Canvas**. If you choose Map Mode, open **Search Location** from the right sidebar or press `Cmd+K`, then search and select a retail location so the map flies to that area.

**Step 2:** Create the store footprint. Click **Create Area** in the bottom tool strip or press `A`. Click to place vertices, then double-click or press `Enter` to close the polygon. The area should render and the rest of the tools should enable.

**Step 3:** Add a back room wall. Click **Draw Wall** in the bottom tool strip or press `W`. Draw a straight wall across the rear section of the area, then double-click to finish.

**Step 4:** Add aisle blocks. Click **Draw Shapes**, choose **Rectangle**, and draw two long rectangles to represent product shelves. Keep them inside the area.

**Step 5:** Place the entrance camera. Click **Place Device** or press `D`, select a camera in the device picker, then click near the store entrance. Make sure the FOV wedge is visible.

**Step 6:** Place the checkout camera. Click **Place Device** again, select a camera, and place it above the checkout counter area. You should now see two distinct camera colors and wedges.

**Step 7:** Tune camera PTZ. Select each camera and open its properties panel. Adjust **Pan** and **Zoom** until the wedges cover the entrance and checkout lanes.

**Step 8:** Place people. Click **Place Person** or press `P`, then place one person near the entrance and another near the checkout. This gives you two motion points to verify coverage.

**Step 9:** Verify selection and transform. Press `V` for Selector Mode, then drag a shelf shape slightly to confirm transforms work within the area.

**Step 10:** Enter Simulation Analysis. Click **Live Preview** in the top bar. Confirm the **radar** appears in the upper-left and the **camera list** appears on the right.

**Step 11:** Check 3D coverage. In the 3D view, confirm the colored FOV volumes intersect the entrance and checkout areas. If a camera misses the target, open its PTZ controls in the right panel and adjust.

**Step 12:** Review camera feeds. Open the **camera feeds** panel on the right and verify each feed shows activity near the entrance and checkout. The feed tiles should reflect the camera colors and detection badges.

**Step 13 (Optional):** Capture evidence. If available, click **Snapshot** or **Start Recording** in the top bar to capture the simulation output.

**Result:** You have a retail store scene with walls, shelves, cameras, and people, and you can see camera coverage confirmed in Simulation Analysis.
