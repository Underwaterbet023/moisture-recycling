// ── River Water Physically-Based Fluid Fragment Shader ────────────────────────
// Implements a realistic dark-blue, blue-gray river water material matching
// natural freshwater rivers:
// - Deep dark-blue base channel
// - Blue-gray and deep river azure mid-tones
// - Muted blue-green / slate shallow bank edges
// - Streamwise longitudinal flow advection (no transverse stripes / ladder rungs)
// - Physical Fresnel reflection and lighting-derived specular surface highlights
// - Localized rapids whitewater only on steep gradients

export const riverWaterFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vFlowDir;
  varying float vSlope;
  varying float vDepth;
  uniform float uTime;
  uniform vec3 uSunPosition;

  // Compact procedural simplex-like 2D noise for organic flow turbulence
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    // ── 1. Parabolic Cross-Stream Velocity (Fluid Open-Channel Flow) ─────────
    // Center channel (u ~ 0.5) flows faster than boundary edges (u ~ 0.0 or 1.0)
    float lateralShear = 0.65 + 0.65 * sin(vUv.x * 3.14159);
    float flowSpeed = (2.2 + vSlope * 6.0) * lateralShear;
    float flowTime = uTime * flowSpeed;

    // ── 2. Streamwise Elongated Flow Advection (No Diagonal Stripes) ────────
    // High aspect ratio coordinates stretch noise strictly along river streamlines
    vec2 streamUV1 = vec2(vUv.x * 4.2, vUv.y * 1.1 - flowTime * 0.85);
    vec2 streamUV2 = vec2(vUv.x * 6.8 + 2.1, vUv.y * 1.9 - flowTime * 1.30);

    float n1 = gnoise(streamUV1);
    float n2 = gnoise(streamUV2);
    float currentSheenValue = (n1 * 0.65 + n2 * 0.35);

    // ── 3. Flow-Aligned Dynamic Surface Normals ──────────────────────────────
    // Tangent normal derivatives make reflections and specular glints drift downstream
    float dU = (gnoise(streamUV1 + vec2(0.06, 0.0)) - n1) * 0.032;
    float dV = (gnoise(streamUV1 + vec2(0.0, 0.06)) - n1) * 0.045;

    vec3 bankVector = vec3(-vFlowDir.y, 0.0, vFlowDir.x);
    vec3 streamVector = vec3(vFlowDir.x, 0.0, vFlowDir.y);

    vec3 norm = normalize(vNormal + bankVector * dU + streamVector * dV);

    // ── 4. Natural Dark-Blue & Blue-Gray River Palette (User Reference) ─────
    vec3 deepNavy      = vec3(0.014, 0.058, 0.145); // Deep channel #040f25
    vec3 midBlueGray   = vec3(0.048, 0.142, 0.252); // Mid river #0c2440
    vec3 shallowSlate  = vec3(0.082, 0.198, 0.278); // Banks #153247

    float dFactor = clamp(vDepth, 0.0, 1.0);
    vec3 waterColor = mix(shallowSlate, midBlueGray, smoothstep(0.0, 0.38, dFactor));
    waterColor = mix(waterColor, deepNavy, smoothstep(0.38, 0.92, dFactor));

    // Silky current ribbons flowing downstream through the channel
    vec3 currentRibbon = vec3(0.095, 0.245, 0.395);
    waterColor = mix(waterColor, currentRibbon, smoothstep(0.05, 0.70, currentSheenValue) * 0.38);

    // ── 5. Mountain Chutes & Whitewater Rapids ───────────────────────────────
    // Where slope is steep (alpine torrents, canyon cascades), water turns into frothing rapids
    float rapidSlope = smoothstep(0.06, 0.24, vSlope);
    float rapidChurn = gnoise(vec2(vUv.x * 8.5, vUv.y * 3.8 - flowTime * 2.2));
    float rapidFoam = rapidSlope * smoothstep(0.05, 0.58, rapidChurn);
    vec3 foamWhite = vec3(0.92, 0.96, 1.0);
    waterColor = mix(waterColor, foamWhite, rapidFoam * 0.85);

    // ── 6. Physical Fresnel Sky Dome Reflection ──────────────────────────────
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float cosTheta = max(dot(viewDir, norm), 0.0);
    float fresnel = 0.025 + 0.975 * pow(1.0 - cosTheta, 5.0);

    vec3 skyZenith  = vec3(0.08, 0.22, 0.48);
    vec3 skyHorizon = vec3(0.24, 0.45, 0.68);
    vec3 skyReflect = mix(skyHorizon, skyZenith, smoothstep(0.0, 0.70, viewDir.y));
    waterColor = mix(waterColor, skyReflect, fresnel * 0.62);

    // ── 7. Moving Specular Surface Highlights ────────────────────────────────
    vec3 sunDir = normalize(uSunPosition);
    vec3 halfVec = normalize(sunDir + viewDir);
    float NdotH = max(dot(norm, halfVec), 0.0);
    float specular = pow(NdotH, 64.0) * 0.75;
    float softSheen = pow(NdotH, 16.0) * 0.12;

    vec3 specHighlight = vec3(0.82, 0.92, 1.0) * specular + vec3(0.45, 0.68, 0.88) * softSheen;
    waterColor += specHighlight;

    // ── 8. Gentle Bank Feathering (No painted white lines or glowing halos) ──
    float bankDist = min(vUv.x, 1.0 - vUv.x);
    float bankFade = smoothstep(0.0, 0.035, bankDist);
    float alpha = mix(0.86, 0.98, smoothstep(0.0, 0.22, vDepth)) * bankFade;

    gl_FragColor = vec4(waterColor, alpha);
  }
`;
