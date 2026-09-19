// ── Waterfall Cascade and Plunge Pool Shaders ──────────────────────────────
export const waterfallVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Churning water displacement as water plunges vertically over the precipice
    float churn = sin(uv.y * 32.0 - uTime * 12.0) * cos(uv.x * 14.0) * 0.08;
    pos.x += churn;
    pos.z += churn * 0.9;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const waterfallFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uSunPosition;

  void main() {
    // High-speed vertical rushing water noise
    float rush1 = sin(vUv.y * 50.0 - uTime * 16.0 + sin(vUv.x * 18.0)) * 0.5 + 0.5;
    float rush2 = cos(vUv.y * 90.0 - uTime * 22.0 - vUv.x * 28.0) * 0.5 + 0.5;
    float totalRush = mix(rush1, rush2, 0.5);

    // Cascading white-water foam & violent spray
    vec3 fallingWater = mix(vec3(0.32, 0.68, 0.86), vec3(0.96, 0.98, 1.0), totalRush * 0.88);

    // Fresnel & specular highlight
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 lightDir = normalize(uSunPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfVec), 0.0), 32.0);
    fallingWater += vec3(1.0, 0.98, 0.92) * spec * 0.7;

    gl_FragColor = vec4(fallingWater, 0.92);
  }
`;

export const tarnPoolVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Gentle expanding concentric ripple rings from the central spring source
    float distFromCenter = length(uv - vec2(0.5));
    float ripple = sin(distFromCenter * 28.0 - uTime * 3.2) * 0.035 * (1.0 - distFromCenter);
    pos.z += ripple;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const tarnPoolFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uSunPosition;

  void main() {
    float distFromCenter = length(vUv - vec2(0.5)) * 2.0;

    // Crystalline glacial tarn colors (pure alpine snowmelt: glacial ice turquoise to deep blue)
    vec3 shallowIce = vec3(0.35, 0.78, 0.88); // Glacial meltwater turquoise
    vec3 deepIce    = vec3(0.04, 0.22, 0.45); // Deep cirque tarn navy
    vec3 waterColor = mix(deepIce, shallowIce, smoothstep(0.2, 0.95, distFromCenter));

    // Central bubbling spring fountain rings
    float springRipples = sin(distFromCenter * 32.0 - uTime * 4.5) * 0.5 + 0.5;
    float centralFoam = (1.0 - smoothstep(0.0, 0.35, distFromCenter)) * springRipples;
    waterColor = mix(waterColor, vec3(0.92, 0.98, 1.0), centralFoam * 0.75);

    // Fresnel sky reflection
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float cosTheta = max(dot(viewDir, vNormal), 0.0);
    float fresnel = 0.04 + 0.96 * pow(1.0 - cosTheta, 4.0);
    vec3 skyReflect = vec3(0.42, 0.72, 0.95);
    waterColor = mix(waterColor, skyReflect, fresnel * 0.65);

    // Sun specular glint
    vec3 lightDir = normalize(uSunPosition);
    vec3 halfVec = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfVec), 0.0), 64.0);
    waterColor += vec3(1.0, 0.98, 0.92) * spec * 0.7;

    float alpha = smoothstep(1.0, 0.85, distFromCenter) * 0.88;
    gl_FragColor = vec4(waterColor, alpha);
  }
`;
