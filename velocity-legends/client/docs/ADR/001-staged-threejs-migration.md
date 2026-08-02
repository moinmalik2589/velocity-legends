# ADR 001: Staged Three.js Renderer Migration

## Decision

Adopt Three.js for the future true-3D racing renderer, staged behind the existing working Phaser client.

## Rationale

A direct replacement would discard working controls, progression, and save behavior before a 3D implementation reaches parity. A staged migration keeps a working release candidate at every step and permits mobile performance validation.

## Consequences

Three.js, original low-poly assets, 3D physics integration, Capacitor packaging, server/admin systems, and Play Store deployment are separate deliverables. They are not represented as complete in the current Phaser-only baseline.
