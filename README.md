# Velocity Legends — World Tour Edition

Original arcade-racing web game inspired by the speed, stunt and presentation language of modern mobile arcade racers. It does **not** contain Asphalt/Gameloft branding, licensed cars, copied tracks, UI art, sounds, or proprietary assets.

## Major systems
- 12 original cars across D/C/B/A/S/S+ classes with individual silhouettes and tuning
- 15-event career, quick race, Classic / Time Attack / Knockout
- 6 long circuits with coast, harbor, canyon, neon city, alpine and storm environments
- Long straights separated by corner complexes
- Cinematic 3-2-1 grid start; all AI physically locked until GO
- Nitro, Perfect Nitro and Shockwave boost presentation
- Drift combos and nitro regeneration
- Ramps, airtime, 360 spins, barrel-roll ramps, stunt rewards
- Shockwave/stunt knockdowns with crash animation, sparks and smoke
- AI nitro trails and recovery after knockdowns
- Dynamic chase camera, speed FOV, camera shake, cinematic bars
- Bloom post-processing on Medium/High graphics
- Weather, wet surfaces, street lights, grandstands, event gates and fictional track branding
- Synthesized engine, wind, crash, nitro, stunt, knockdown and menu audio
- Mobile touch, keyboard and Gamepad API controls
- Garage purchase, per-car upgrades, credits, achievements, daily rewards, persistent local save
- PWA + Capacitor Android project

## Controls
W / Up = accelerate
S / Down = brake/reverse
A,D / Left,Right = steer
Space = drift
Double-tap Drift or E = 360 spin
Shift = nitro
R = restart
Esc = pause

## Run
npm install
npm run dev

Open http://localhost:1807

## Asset / reference policy
The shipped race world and vehicle meshes are original procedural geometry and generated textures, so the build is self-contained. CC0 asset sources suitable for later optional model replacement include Kenney and Quaternius. No proprietary Asphalt assets are included.


## RoadLife / Stability Pass

This build adds the requested race-engine fixes and realism pass:

- Full-track scenery clearance so mountains, buildings, rocks and trees cannot be spawned across another road segment.
- Strong four-wheel landing recovery after ramps/barrel rolls so the player car cannot remain stuck leaning on two tyres.
- Sustained AI pace model with per-rival base/max pace and mild race-position adaptation instead of progressive slowdown.
- Dedicated Endless Practice mode with no rivals, no finish condition and no minimap.
- Larger dedicated practice circuit for uninterrupted driving.
- Animated vegetation sway, moving water surface response, flickering city-window illumination and steering front wheels.
- Existing cinematic start, stunt, nitro, knockdown, career, garage and long-circuit systems remain intact.


## Grounded Snow 5.1 fixes
- Alpine Rush contrast rebuilt: darker asphalt/shoulders, blue-grey snow, reduced fog washout, darker mountains and muted snowfall.
- Per-car tyre-contact ride height: each body family sits on its actual wheel radius instead of one shared Y value.
- Jump landing is now height/velocity driven, so gravity cannot stop while the car is still above the road.
- Grounded cars continuously settle back to their correct tyre-contact height.
