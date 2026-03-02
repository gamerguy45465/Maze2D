precision highp float;

varying vec2 frag_vector;



void main()
{
    gl_FragColor = vec4(frag_vector, 0.0, 0.0);

}
