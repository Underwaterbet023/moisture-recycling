// ── Ocean Water Optical Fragment Shader ──────────────────────────────────────
// Generates realistic dark blue ocean water with lighting-derived wave crests,
// physical Fresnel reflection, sun specular glitter, and procedural micro-ripples.
// Zero artificial 2D color bands or sine stripes.

export const oceanWaterFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vWaveSlope;
  varying float vWaveHeight;
  uniform float uTime;
  uniform vec3 uSunPosition;

  void main() {
    // 1. Distance from camera
    float distFromCamera = length(vWorldPosition - cameraPosition);

    // 2. Secondary Procedural Capillary Ripples (Small-scale normal perturbation)
    // Filtered at distance to eliminate aliasing and horizon sparkle
    float microFade = 1.0 - smoothstep(100.0, 450.0, distFromCamera);
    vec2 posXZ = vWorldPosition.xz;
    float t = uTime * 0.65;

    vec2 uv1 = posXZ * 0.14 + vec2( t * 0.06,  t * 0.04);
    vec2 uv2 = vec2(posXZ.y, -posXZ.x) * 0.26 - vec2(t * 0.05, -t * 0.07);
    vec2 uv3 = vec2(posXZ.x + posXZ.y, posXZ.x - posXZ.y) * 0.40 + vec2(-t * 0.09, t * 0.06);

    float n1 = sin(uv1.x * 1.5 + cos(uv1.y * 1.8)) * 0.025;
    float n2 = cos(uv2.x * 2.1 - sin(uv2.y * 1.4)) * 0.018;
    float n3 = sin(uv3.x * 2.8 + uv3.y * 2.4) * 0.012;

    vec3 microOffset = vec3(n1 + n3, 0.0, n2 + n3) * microFade;
    vec3 waveNorm = normalize(vNormal + microOffset);

    // 3. Realistic Depth-Dependent Color Palette (Dark Blue Ocean Base)
    // Deep offshore abyss: Dark rich oceanic navy
    // Continental shelf: Classic deep marine blue
    // Coastal shallows: Clear blue-green marine water
    float offshoreT = clamp((-34.0 - vWorldPosition.x) / 80.0, 0.0, 1.0);
    vec3 shallowMarine = vec3(0.020, 0.125, 0.220); // Coastal deep blue-green
    vec3 midOceanBlue  = vec3(0.009, 0.052, 0.145); // Deep marine blue
    vec3 abyssalNavy   = vec3(0.004, 0.020, 0.075); // Dark oceanic navy

    vec3 baseWaterColor = mix(shallowMarine, midOceanBlue, smoothstep(0.05, 0.45, offshoreT));
    baseWaterColor = mix(baseWaterColor, abyssalNavy, smoothstep(0.45, 1.0, offshoreT));

    // 4. Estuary Freshwater Mixing Zone (River mouth at x = -38, z = 82)
    float distToEstuary = length(vWorldPosition.xz - vec2(-38.0, 82.0));
    if (distToEstuary < 48.0) {
      float estuaryT = smoothstep(48.0, 8.0, distToEstuary);
      vec3 estuaryMix = vec3(0.035, 0.165, 0.245); // Mineral river-sea transition
      baseWaterColor = mix(baseWaterColor, estuaryMix, estuaryT * 0.50);
    }

    // 5. Physical Fresnel Reflection
    // F0 = 0.02 (water surface reflectance at normal incidence)
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float NdotV = max(dot(viewDir, waveNorm), 0.0);
    float fresnel = 0.02 + 0.98 * pow(1.0 - NdotV, 5.0);

    // Sky dome reflection: deep maritime blue sky reflection (no white horizon washout)
    float skyAngle = max(0.0, viewDir.y);
    vec3 skyZenith  = vec3(0.065, 0.185, 0.420);
    vec3 skyHorizon = vec3(0.145, 0.315, 0.520);
    vec3 skyReflection = mix(skyHorizon, skyZenith, smoothstep(0.0, 0.75, skyAngle));

    // Blend base dark-blue water with sky reflection via Fresnel
    vec3 finalColor = mix(baseWaterColor, skyReflection, fresnel * 0.55);

    // 6. Traveling Wave Crest Highlights (Locked to 3D Wave Peaks & Lighting)
    // Steep wave faces at the top of traveling crests catch vibrant marine blue reflections
    vec3 sunDir = normalize(uSunPosition);
    float NdotL = max(dot(waveNorm, sunDir), 0.0);
    
    float heightPeak = smoothstep(0.4, 2.0, vWaveHeight);
    float crestLightFactor = (smoothstep(0.08, 0.26, vWaveSlope) * 0.5 + heightPeak * 0.5) * pow(NdotL, 1.3);
    vec3 sunlitWaveFace = vec3(0.12, 0.32, 0.56); // Subtle deep marine facet reflection
    finalColor = mix(finalColor, sunlitWaveFace, crestLightFactor * 0.40);

    // 7. Dynamic Elongated Wave Crest Foam (Continuous Along Crest Lines, No Cow Spots)
    // Ocean wave fronts run north-south (along Z), propagating eastward (+X)
    float crestStreak = sin(posXZ.y * 0.18 + sin(posXZ.x * 0.06 + t * 0.5) * 2.2);
    float crestFoam = smoothstep(1.30, 2.2, vWaveHeight) * smoothstep(0.10, 0.25, vWaveSlope);
    crestFoam *= smoothstep(-0.3, 0.5, crestStreak) * smoothstep(0.15, 0.50, offshoreT);
    vec3 whitecapColor = vec3(0.91, 0.95, 1.0);
    finalColor = mix(finalColor, whitecapColor, crestFoam * 0.40);

    // 8. Sun Specular Glitter Path (Dancing localized glints on wave facets)
    vec3 halfVec = normalize(sunDir + viewDir);
    float NdotH = max(dot(waveNorm, halfVec), 0.0);
    float sharpGlint = pow(NdotH, 220.0) * 0.95;
    float broadGlint = pow(NdotH, 48.0) * 0.06;
    vec3 sunGlintColor = vec3(0.96, 0.94, 0.86);
    finalColor += sunGlintColor * (sharpGlint + broadGlint);

    // 9. Natural Shoreline Surf Swash (Soft foam rolling onto beach)
    float coastDist = vWorldPosition.x - (-38.0);
    if (coastDist > -14.0 && coastDist < 4.0) {
      float swashPhase = coastDist * 0.4 + sin(vWorldPosition.z * 0.06) * 1.6 - uTime * 1.1;
      float swash = smoothstep(-12.0, -1.0, coastDist) * pow(max(0.0, sin(swashPhase)), 4.0);
      swash *= smoothstep(3.5, 0.0, coastDist);
      finalColor = mix(finalColor, vec3(0.88, 0.94, 0.98), swash * 0.55);
    }

    // 10. Deep Maritime Distance Haze (Horizon ocean blends into atmospheric sky)
    float hazeT = smoothstep(250.0, 1600.0, distFromCamera);
    vec3 hazeColor = vec3(0.10, 0.22, 0.38); // Deep oceanic maritime haze
    finalColor = mix(finalColor, hazeColor, hazeT * 0.48);

    gl_FragColor = vec4(finalColor, 0.98);
  }
`;
