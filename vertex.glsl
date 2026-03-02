precision highp float;

varying vec2 pos_vector;
uniform mat4 uProjectionMatrix;

void main()
{
    gl_Position = uProjectionMatrix * vec4(pos_vector, 0.0, 0.0);
}