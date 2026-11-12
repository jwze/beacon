/**
 * 首页背景粒子波浪
 *
 * 一组沿 Y 轴起伏的点云，由顶点着色器按 sin/cos 波形实时位移。
 * 着色器与点阵生成参数与原内联实现完全一致。
 */
import { ShaderProgram } from './shader-program.js';
import { PARTICLE_TEXTURE } from './particle-texture.js';

const POINT_SIZE = 2.5;

const VERTEX = `
#define M_PI 3.1415926535897932384626433832795
precision highp float;
attribute vec4 a_position;
attribute vec4 a_color;
uniform float u_time;
uniform float u_size;
uniform float u_speed;
uniform vec3 u_field;
uniform mat4 u_projection;
varying vec4 v_color;
void main() {
    vec3 pos = a_position.xyz;
    pos.y += (
        cos(pos.x / u_field.x * M_PI * 8.0 + u_time * u_speed) +
        sin(pos.z / u_field.z * M_PI * 8.0 + u_time * u_speed)
    ) * u_field.y;
    gl_Position = u_projection * vec4(pos.xyz, a_position.w);
    gl_PointSize = (u_size / gl_Position.w) * 100.0;
    v_color = a_color;
}`;

const FRAGMENT = `
precision highp float;
uniform sampler2D u_texture;
varying vec4 v_color;
void main() {
    gl_FragColor = v_color * texture2D(u_texture, gl_PointCoord);
}`;

/**
 * @param {HTMLElement} holder 承载 canvas 的容器（.waves）
 * @returns {ShaderProgram|undefined} WebGL 不可用时返回 undefined
 */
export function createWavesBackground(holder) {
  if (!holder) return undefined;

  return new ShaderProgram(holder, {
    texture: PARTICLE_TEXTURE,
    uniforms: {
      size: { type: 'float', value: POINT_SIZE },
      field: { type: 'vec3', value: [0, 0, 0] },
      speed: { type: 'float', value: 5 },
    },
    vertex: VERTEX,
    fragment: FRAGMENT,
    onResize(width, height, dpi) {
      const position = [];
      const color = [];
      const planeWidth = 400 * (width / height);
      const depth = 400;
      const fieldHeight = 3;
      const distance = 5;

      for (let x = 0; x < planeWidth; x += distance) {
        for (let z = 0; z < depth; z += distance) {
          position.push(-planeWidth / 2 + x, -30, -depth / 2 + z);
          // 由左至右 绿→青 渐变，纵深方向控制透明度
          color.push(0, 1 - (x / planeWidth) * 1, 0.5 + (x / planeWidth) * 0.5, z / depth);
        }
      }

      this.uniforms.field = [planeWidth, fieldHeight, depth];
      this.buffers.position = position;
      this.buffers.color = color;
      this.uniforms.size = (height / 400) * POINT_SIZE * dpi;
    },
  });
}

export default createWavesBackground;
