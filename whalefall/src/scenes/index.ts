import React from 'react';
import {S01Descent} from './S01_Descent';
import {S02Sonar} from './S02_Sonar';
import {S03Desert} from './S03_Desert';
import {S04Scavengers} from './S04_Scavengers';
import {S05Osedax} from './S05_Osedax';
import {S06Sulfide} from './S06_Sulfide';
import {S07Bloom} from './S07_Bloom';
import {S08Map} from './S08_Map';
import {S09Shenhai} from './S09_Shenhai';
import {S10Rise} from './S10_Rise';
import {bar, BREAK, DROP2} from '../lib/time';

export type SceneDef = {t0: number; t1: number; C: React.FC; fadeIn?: number; fadeOut?: number};

// 场景表：切点落在 BGM 的小节线（bar）或段落点上（见 lib/time.ts）
export const SCENES: SceneDef[] = [
	{t0: 0, t1: 22.4, C: S01Descent, fadeIn: 1.2},
	{t0: 22.4, t1: 28.0, C: S02Sonar, fadeIn: 0.25},
	{t0: 28.0, t1: 43.0, C: S03Desert, fadeIn: 0.3},
	{t0: 43.0, t1: bar(26), C: S04Scavengers, fadeIn: 0.3},
	{t0: bar(26), t1: BREAK, C: S05Osedax, fadeIn: 0.25},
	{t0: BREAK, t1: DROP2, C: S06Sulfide, fadeIn: 0.8, fadeOut: 0.05},
	{t0: DROP2, t1: bar(51), C: S07Bloom, fadeIn: 0.05},
	{t0: bar(51), t1: bar(59), C: S08Map, fadeIn: 0.4},
	{t0: bar(59), t1: bar(65), C: S09Shenhai, fadeIn: 0.4},
	{t0: bar(65), t1: 160, C: S10Rise, fadeIn: 0.3, fadeOut: 1.0},
];
