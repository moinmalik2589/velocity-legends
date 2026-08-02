import * as THREE from "three";

export class RacerState {
  constructor(id) {
    this.id = id;
    this.completedLaps = 0;
    this.currentCheckpointIndex = 0;
    this.previousCheckpointIndex = 0;
    this.passedCheckpointCount = 0;
    this.normalizedSegmentProgress = 0;
    this.maxProgressThisLap = 0;
    this.lastValidPosition = new THREE.Vector3(0, 0, 0);
  }

  get totalProgress() {
    // Primary score based on completed laps + checkpoints + segment fraction
    return (
      this.completedLaps * 10000 +
      this.passedCheckpointCount +
      this.normalizedSegmentProgress
    );
  }
}

export class RaceProgress {
  constructor(racerIds = [], totalLaps = 4) {
    this.totalLaps = totalLaps;
    this.racers = new Map();

    racerIds.forEach((id) => {
      this.racers.set(id, new RacerState(id));
    });
  }

  state(racerId) {
    return this.racers.get(racerId);
  }

  setState(racerId, patchState) {
    const racer = this.racers.get(racerId);
    if (!racer) return;

    // Mutate existing object in-place to preserve object references
    Object.assign(racer, patchState);

    // If completedLaps was not explicitly passed, compute from passed checkpoints
    if (
      patchState.completedLaps === undefined &&
      patchState.passedCheckpointCount !== undefined
    ) {
      racer.completedLaps = Math.floor(racer.passedCheckpointCount / 4);
    }

    if (patchState.lastValidPosition) {
      racer.lastValidPosition = patchState.lastValidPosition.clone();
    }
  }

  advanceCheckpoint(racerId) {
    const racer = this.racers.get(racerId);
    if (!racer) return;

    racer.passedCheckpointCount += 1;
    racer.previousCheckpointIndex = racer.currentCheckpointIndex;
    racer.currentCheckpointIndex = racer.passedCheckpointCount % 4; // 4 checkpoints per lap
    racer.completedLaps = Math.floor(racer.passedCheckpointCount / 4);
    racer.normalizedSegmentProgress = 0;
    racer.maxProgressThisLap = 0;
  }

  updateFromWorldPosition(racerId, worldPos, checkpoints, trackWidth = 6) {
    const racer = this.racers.get(racerId);
    if (!racer || !checkpoints || checkpoints.length === 0) return;

    const numCheckpoints = checkpoints.length;
    const currIdx = racer.currentCheckpointIndex;
    const nextIdx = (currIdx + 1) % numCheckpoints;

    const currPoint = checkpoints[currIdx];
    const nextPoint = checkpoints[nextIdx];

    // Project world position onto current segment (currPoint -> nextPoint)
    const segment = new THREE.Vector3().subVectors(nextPoint, currPoint);
    const segmentLength = segment.length();

    if (segmentLength > 0) {
      const segmentDir = segment.clone().normalize();
      const toPos = new THREE.Vector3().subVectors(worldPos, currPoint);
      const projection = toPos.dot(segmentDir);

      let t = THREE.MathUtils.clamp(projection / segmentLength, 0, 1);
      racer.normalizedSegmentProgress = Math.max(
        racer.normalizedSegmentProgress,
        t
      );

      // Save position if near track segment
      const closestOnSegment = currPoint
        .clone()
        .add(segmentDir.multiplyScalar(projection));
      if (worldPos.distanceTo(closestOnSegment) <= trackWidth * 2) {
        racer.lastValidPosition.copy(worldPos);
      }

      // Checkpoint advance trigger threshold
      const distToNext = worldPos.distanceTo(nextPoint);
      if (distToNext < trackWidth && racer.normalizedSegmentProgress > 0.8) {
        this.advanceCheckpoint(racerId);
      }
    }
  }

  recoverRacer(racerId, currentPos, checkpoints) {
    const racer = this.racers.get(racerId);
    if (!racer) return new THREE.Vector3(0, 0, 0);

    // Retain valid checkpoint indices, lap count, and position
    const restoredPos = racer.lastValidPosition.clone();

    // Ensure progress remains monotonic after recovery
    if (checkpoints && checkpoints.length > 0) {
      const targetCp = checkpoints[racer.currentCheckpointIndex];
      if (restoredPos.equals(new THREE.Vector3(0, 0, 0)) && targetCp) {
        restoredPos.copy(targetCp);
      }
    }

    return restoredPos;
  }

  rank() {
    return Array.from(this.racers.values()).sort((a, b) => {
      // Rule: Completed laps prioritize over passed checkpoints
      if (a.completedLaps !== b.completedLaps) {
        return b.completedLaps - a.completedLaps;
      }
      return b.totalProgress - a.totalProgress;
    });
  }

  position(racerId) {
    const ranked = this.rank();
    const index = ranked.findIndex((r) => r.id === racerId);
    return index !== -1 ? index + 1 : ranked.length;
  }
}