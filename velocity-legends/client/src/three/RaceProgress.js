const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** The sole owner of ordered checkpoint progress and racer ranking. */
export class RaceProgress {
  constructor(racerIds, checkpointCount = 4) {
    this.checkpointCount = checkpointCount;
    this.racers = new Map(racerIds.map((racerId, gridOrder) => [racerId, {
      racerId, gridOrder, completedLaps: 0,
      currentCheckpointIndex: 0, previousCheckpointIndex: checkpointCount - 1,
      passedCheckpointCount: 0, distanceToNextCheckpoint: Infinity,
      normalizedSegmentProgress: 0, totalProgress: 0, maxProgressThisLap: 0,
      lastValidCheckpointIndex: checkpointCount - 1, lastValidPosition: null,
      lastValidRotation: null, lastValidProgress: 0,
      finished: false, finishOrder: 0, recovering: false, active: true, insideNext: false,
    }]));
  }

  state(id) { return this.racers.get(id); }

  assertState(state) {
    const valid = Number.isFinite(state.completedLaps) && Number.isFinite(state.passedCheckpointCount)
      && Number.isFinite(state.normalizedSegmentProgress) && Number.isFinite(state.totalProgress)
      && state.completedLaps >= 0 && state.passedCheckpointCount >= 0
      && state.normalizedSegmentProgress >= 0 && state.normalizedSegmentProgress <= 1
      && state.totalProgress + 0.0001 >= state.lastValidProgress;
    if (!valid) throw new Error(`Invalid race progress for ${state.racerId}`);
  }

  updateTotal(state, preserveProgress = true) {
    // passedCheckpointCount is cumulative; completedLaps is retained separately for ranking.
    const candidate = state.passedCheckpointCount + state.normalizedSegmentProgress;
    state.totalProgress = preserveProgress ? Math.max(state.totalProgress, candidate) : candidate;
    state.lastValidProgress = Math.max(state.lastValidProgress, state.totalProgress);
  }

  setState(id, patch) {
    const state = this.state(id);
    if (!state) throw new Error(`Unknown racer ${id}`);
    Object.assign(state, patch);
    state.normalizedSegmentProgress = clamp(state.normalizedSegmentProgress, 0, 1);
    this.updateTotal(state, false);
    this.assertState(state);
    return state;
  }

  advanceCheckpoint(id) {
    const state = this.state(id);
    if (!state || !state.active || state.finished) return state;
    state.previousCheckpointIndex = state.currentCheckpointIndex;
    state.lastValidCheckpointIndex = state.currentCheckpointIndex;
    state.currentCheckpointIndex += 1;
    state.passedCheckpointCount += 1;
    state.normalizedSegmentProgress = 0;
    state.maxProgressThisLap = 0;
    if (state.currentCheckpointIndex >= this.checkpointCount) {
      state.completedLaps += 1;
      state.currentCheckpointIndex = 0;
    }
    this.updateTotal(state);
    this.assertState(state);
    return state;
  }

  updateFromWorldPosition(id, position, checkpoints, radius = 6) {
    const state = this.state(id);
    if (!state || !state.active || state.finished || state.recovering) return state;
    const next = checkpoints[state.currentCheckpointIndex];
    const previous = checkpoints[state.previousCheckpointIndex];
    if (!next || !previous) throw new Error(`Invalid checkpoint route for ${id}`);
    const segment = next.clone().sub(previous);
    const relative = position.clone().sub(previous);
    const projection = clamp(relative.dot(segment) / Math.max(segment.lengthSq(), 0.0001), 0, 1);
    // Small steering/collision deviations may not remove earned segment progress.
    state.normalizedSegmentProgress = Math.max(state.maxProgressThisLap, projection);
    state.maxProgressThisLap = state.normalizedSegmentProgress;
    state.distanceToNextCheckpoint = position.distanceTo(next);
    if (state.distanceToNextCheckpoint <= radius && !state.insideNext) {
      state.insideNext = true;
      state.lastValidPosition = position.clone();
      this.advanceCheckpoint(id);
    }
    if (state.distanceToNextCheckpoint > radius * 1.25) state.insideNext = false;
    this.updateTotal(state);
    this.assertState(state);
    return state;
  }

  /** Shared manual/stuck/off-route recovery; it never replaces or rewinds logical racer state. */
  recoverRacer(id, fallbackPosition, checkpoints) {
    const state = this.state(id);
    if (!state) throw new Error(`Unknown racer ${id}`);
    state.recovering = true;
    const restored = (state.lastValidPosition || fallbackPosition).clone();
    const next = checkpoints[state.currentCheckpointIndex];
    state.distanceToNextCheckpoint = restored.distanceTo(next);
    state.normalizedSegmentProgress = clamp(state.maxProgressThisLap, 0, 1);
    state.insideNext = false;
    // Do not turn a physical reposition into a logical race rewind.
    this.updateTotal(state);
    state.recovering = false;
    this.assertState(state);
    return restored;
  }

  reconcileAfterRespawn(id, position, checkpoints) {
    return this.recoverRacer(id, position, checkpoints);
  }

  rank() {
    return [...this.racers.values()].sort((a, b) => {
      if (a.finished && b.finished) return a.finishOrder - b.finishOrder;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      if (a.completedLaps !== b.completedLaps) return b.completedLaps - a.completedLaps;
      if (a.passedCheckpointCount !== b.passedCheckpointCount) return b.passedCheckpointCount - a.passedCheckpointCount;
      if (Math.abs(a.normalizedSegmentProgress - b.normalizedSegmentProgress) > 0.0001) return b.normalizedSegmentProgress - a.normalizedSegmentProgress;
      return a.gridOrder - b.gridOrder;
    });
  }

  position(id) { return this.rank().findIndex((state) => state.racerId === id) + 1; }
}
