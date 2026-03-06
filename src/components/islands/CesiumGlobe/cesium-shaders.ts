import { PostProcessStage } from 'cesium';

export type VisualMode = 'normal' | 'crt' | 'nvg' | 'thermal';

/** CRT scan lines + vignette + phosphor glow */
export function createCRTStage(): PostProcessStage {
  return new PostProcessStage({
    name: 'crt',
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;

      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);

        // Scan lines
        float scanline = sin(v_textureCoordinates.y * 800.0) * 0.06;

        // Vignette
        vec2 uv = v_textureCoordinates - 0.5;
        float vignette = smoothstep(0.8, 0.35, length(uv));

        // Slight chromatic aberration
        float r = texture(colorTexture, v_textureCoordinates + vec2(0.001, 0.0)).r;
        float g = color.g;
        float b = texture(colorTexture, v_textureCoordinates - vec2(0.001, 0.0)).b;

        // Phosphor tint (slight green/amber)
        vec3 phosphor = vec3(r * 0.95, g * 1.05, b * 0.9);

        out_FragColor = vec4(phosphor * (1.0 - scanline) * vignette, 1.0);
      }
    `,
  });
}

/** Night Vision (green monochrome + noise grain) */
export function createNVGStage(): PostProcessStage {
  return new PostProcessStage({
    name: 'nvg',
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;

      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);

        // Luminance
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        // Boost brightness
        lum = pow(lum, 0.8) * 1.4;

        // Noise grain
        float noise = rand(v_textureCoordinates * 500.0 + vec2(czm_frameNumber * 0.01)) * 0.08;

        // Vignette
        vec2 uv = v_textureCoordinates - 0.5;
        float vignette = smoothstep(0.9, 0.3, length(uv));

        // Green monochrome
        vec3 nvg = vec3(0.1, lum + noise, 0.05) * vignette;

        out_FragColor = vec4(nvg, 1.0);
      }
    `,
  });
}

/** Thermal / FLIR simulation (heat-map color ramp) */
export function createThermalStage(): PostProcessStage {
  return new PostProcessStage({
    name: 'thermal',
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;

      vec3 heatmap(float t) {
        // Dark blue -> purple -> red -> orange -> yellow -> white
        vec3 c;
        if (t < 0.2) c = mix(vec3(0.0, 0.0, 0.2), vec3(0.3, 0.0, 0.5), t / 0.2);
        else if (t < 0.4) c = mix(vec3(0.3, 0.0, 0.5), vec3(0.8, 0.0, 0.2), (t - 0.2) / 0.2);
        else if (t < 0.6) c = mix(vec3(0.8, 0.0, 0.2), vec3(1.0, 0.5, 0.0), (t - 0.4) / 0.2);
        else if (t < 0.8) c = mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.6) / 0.2);
        else c = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), (t - 0.8) / 0.2);
        return c;
      }

      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));

        vec3 thermal = heatmap(lum);

        out_FragColor = vec4(thermal, 1.0);
      }
    `,
  });
}

/** Create bloom post-processing stage */
export function createBloomStage(): PostProcessStage {
  return new PostProcessStage({
    name: 'bloom',
    fragmentShader: `
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;

      void main() {
        vec4 color = texture(colorTexture, v_textureCoordinates);
        // Simple glow: brighten highlights
        float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float bloom = smoothstep(0.4, 1.0, lum) * 0.3;
        out_FragColor = vec4(color.rgb + bloom, 1.0);
      }
    `,
  });
}
