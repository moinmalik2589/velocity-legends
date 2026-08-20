import assert from 'node:assert/strict';
import {CARS,TRACKS,EVENTS,ACHIEVEMENTS} from '../src/data.js';
assert.equal(CARS.length,12,'Final build must include 12 cars');
assert.equal(EVENTS.length,15,'Final build must include 15 career events');
assert.ok(Object.keys(TRACKS).length>=6,'Final build must include at least 6 tracks');
assert.equal(new Set(CARS.map(x=>x.id)).size,CARS.length,'Car ids must be unique');
assert.equal(new Set(EVENTS.map(x=>x.id)).size,EVENTS.length,'Event ids must be unique');
for(const e of EVENTS){assert.ok(TRACKS[e.track],`Missing track ${e.track}`);assert.ok(['Classic','Time Attack','Knockout'].includes(e.mode),`Bad mode ${e.mode}`);assert.ok(e.laps>=2);assert.ok(e.ai>=3)}
for(const c of CARS){assert.ok(c.top>0&&c.accel>0&&c.handling>0&&c.nitro>0);assert.ok(c.price>=0)}
assert.ok(ACHIEVEMENTS.length>=6);
console.log(`Validated ${CARS.length} cars, ${Object.keys(TRACKS).length} tracks, ${EVENTS.length} career events and ${ACHIEVEMENTS.length} achievements.`);
