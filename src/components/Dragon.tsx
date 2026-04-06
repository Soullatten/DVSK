import { Effect, EffectComposer, EffectPass, RenderPass } from "postprocessing";
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type PixelDragonVariant = 'sqaure' | 'circle' | 'triangle' | 'diamond';

interface TouchPoint {
    x: number;
    y: number;
}