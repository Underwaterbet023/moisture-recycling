// ── River Water Directional Flow Vertex Shader ──────────────────────────────
export const riverWaterVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying vec2 vFlowDir;
  varying float vSlope;
  varying float vDepth;
  uniform float uTime;

  attribute vec2 aFlowDir;
  attribute float aSlope;
  attribute float aDepth;

  void main() {
    vUv = uv;
    vFlowDir = aFlowDir;
    vSlope = aSlope;
    vDepth = aDepth;

    vec3 pos = position;

    // Smooth longitudinal waves traveling downstream along the river channel
    float flowSpeed = 2.2 + aSlope * 5.0;
    float flowTime = uTime * flowSpeed * 1.4;
    float ripple = sin(uv.y * 3.5 - flowTime) * 0.022 * sin(uv.x * 3.14159);

    // Agitated churning displacement strictly on steep mountain rapids
    float rapidDisp = 0.0;
    if (aSlope > 0.08) {
      float churn = sin(uv.x * 6.0 + (uv.y * 8.0 - flowTime * 2.5)) * 0.05;
      rapidDisp = churn * min(0.14, (aSlope - 0.08) * 0.6);
    }
    pos.y += ripple + rapidDisp;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;
