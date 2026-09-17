import React, { useEffect, useRef } from 'react';

// We'll use the user's provided logic but adapted for React and the current environment.
// The user's script uses external utilities from CDN.

export const GargantuaSimulation: React.FC<{ enjoyTrigger?: number }> = ({ enjoyTrigger = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enjoyStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (enjoyTrigger > 0) {
      enjoyStartTimeRef.current = Date.now();
    }
  }, [enjoyTrigger]);

  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;
    let animationFrameId: number;

    const init = async () => {
      // Dynamic imports for the utilities
      const [
        { default: canvasManager },
        { ShaderBuilder },
      ] = await Promise.all([
        import('https://cdn.jsdelivr.net/gh/gh-o-st/utilities@stable/canvasmanager.js' as any),
        import('https://cdn.jsdelivr.net/gh/gh-o-st/utilities@stable/shaderbuilder.js' as any),
      ]);

      if (!isMounted || !canvasRef.current) return;

      const manager = canvasManager().attach(canvasRef.current);
      const canvas = canvasRef.current;
      const gl = manager.context('webgl2');

      manager.resize('full', 'full').listen('resize');

      // Interstellar Gold
      const discColor = { r: 1.0, g: 0.75, b: 0.35 };

      const vsource = `#version 300 es
precision highp float;

in vec2 a_position;
out vec2 v_texCoord;

void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

      const fsource = `#version 300 es
precision highp float;

in vec2 v_texCoord;
out vec4 fragColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform sampler2D u_texture0;
uniform vec3 u_discColor;
uniform float u_enjoyTime;

#define AA 2
#define _Speed 0.15
#define _Steps  12.0  
#define _Size 0.23

float hash(float x){ return fract(sin(x)*152754.742);}
float hash(vec2 x){	return hash(x.x + hash(x.y));}

float value(vec2 p, float f)
{
    vec2 floored = floor(p*f);
    float bl = hash(floored);
    float br = hash(floored + vec2(1.,0.));
    float tl = hash(floored + vec2(0.,1.));
    float tr = hash(floored + vec2(1.,1.));

    vec2 fr = fract(p*f);    
    fr = (3. - 2.*fr)*fr*fr;	
    float b = mix(bl, br, fr.x);	
    float t = mix(tl, tr, fr.x);
    return  mix(b,t, fr.y);
}

vec4 background(vec3 ray)
{
    vec2 uv = ray.xy * 0.5 + 0.5; 
    float r = length(ray.xy);

    // Gravitational lensing effect on the background
    float lensing = exp(-2.5 * r * r); 
    uv = mix(uv, vec2(0.5), lensing); 

    // Deep, dark cosmic black - a base with a hint of space depth
    // Not #000, but a very dark navy-charcoal
    vec3 cosmicBase = vec3(0.011, 0.011, 0.019); // Matches #030305 roughly in linear space
    
    // Use the nebula texture for subtle "gas" depth
    vec4 nebulae = texture(u_texture0, uv);
    nebulae.rgb = pow(nebulae.rgb, vec3(2.0)) * 0.1; // Very faintGas
    
    // Add "Cosmic Dust" - subtle high-frequency noise for texture
    float dust = value(uv * 10.0, 150.0);
    dust = pow(dust, 12.0) * 0.02;
    
    vec3 finalBg = cosmicBase + nebulae.rgb + vec3(dust);

    // Background stars - slightly dimmer and more varied
    float brightness = value(uv * 4.0, 95.0);
    brightness = pow(brightness, 300.0);
    
    // Absorption effect on stars
    if (u_enjoyTime > 4.0 && u_enjoyTime < 7.0) {
        float pull = smoothstep(4.0, 6.0, u_enjoyTime);
        uv = mix(uv, vec2(0.5), pull * 0.5);
        brightness *= (1.0 + pull * 2.0);
    }
    
    brightness = clamp(brightness * 35.0, 0.0, 1.0); 
    vec3 stars = brightness * mix(vec3(1.0, 0.95, 0.9), vec3(0.8, 0.9, 1.0), value(uv * 3.0, 30.0));

    // Subtle radial falloff for "infinite" feel
    float distToCenter = length(uv - 0.5);
    finalBg *= (1.0 - distToCenter * 0.25);

    return vec4(finalBg + stars, 1.0);
}

vec4 raymarchDisk(vec3 ray, vec3 zeroPos)
{    
    vec3 position = zeroPos;      
    float lengthPos = length(position.xz);
    float dist = min(1., lengthPos*(1./_Size) *0.5) * _Size * 0.4 *(1./_Steps) /( abs(ray.y) );

    position += dist*_Steps*ray*0.4;     

    vec2 deltaPos;
    deltaPos.x = -zeroPos.z*0.01 + zeroPos.x;
    deltaPos.y = zeroPos.x*0.01 + zeroPos.z;
    deltaPos = normalize(deltaPos - zeroPos.xz);

    float parallel = dot(ray.xz, deltaPos);
    parallel /= sqrt(lengthPos);
    parallel *= 0.4;
    float redShift = parallel +0.35;
    redShift *= redShift;

    redShift = clamp(redShift, 0., 1.);

    float disMix = clamp((lengthPos - _Size * 2.)*(1./_Size)*0.24, 0., 1.);

    vec3 baseCol = u_discColor;
    vec3 altCol = vec3(0.5,0.17,0.38)*0.25;
    vec3 insideCol = mix(baseCol, altCol, disMix);
    insideCol *= mix(vec3(0.4, 0.2, 0.1), vec3(1.6, 2.4, 4.0), redShift);
    insideCol *= 1.28;
    redShift += 0.08;
    redShift *= redShift;

    vec4 o = vec4(0.);

    for(float i = 0. ; i < _Steps; i++)
    {                      
        position -= dist * ray ;  

        float intensity =clamp( 1. - abs((i - 0.8) * (1./_Steps) * 2.), 0., 1.); 
        float lengthPos = length(position.xz);
        float distMult = 1.;

        distMult *=  clamp((lengthPos -  _Size * 0.75) * (1./_Size) * 1.5, 0., 1.);        
        distMult *= clamp(( _Size * 10. -lengthPos) * (1./_Size) * 0.20, 0., 1.);
        distMult *= distMult;

        float u = lengthPos + u_time* _Size*0.3 + intensity * _Size * 0.2;

        vec2 xy ;
        float rot = mod(u_time*_Speed, 8192.0);
        xy.x = -position.z*sin(rot) + position.x*cos(rot);
        xy.y = position.x*sin(rot) + position.z*cos(rot);

        float x = abs( xy.x/(xy.y));         
        float angle = 0.02*atan(x);

        const float f = 70.;
        float noise = value( vec2( angle, u * (1./_Size) * 0.05), f);
        noise = noise*0.66 + 0.33*value( vec2( angle, u * (1./_Size) * 0.05), f*2.);     

        float extraWidth =  noise * 1. * (1. -  clamp(i * (1./_Steps)*2. - 1., 0., 1.));

        float alpha = clamp(noise*(intensity + extraWidth)*( (1./_Size) * 10.  + 0.01 ) *  dist * distMult , 0., 1.);

        vec3 col = 2.*mix(vec3(0.3,0.2,0.15)*insideCol, insideCol, min(1.,intensity*2.));
        o = clamp(vec4(col*alpha + o.rgb*(1.-alpha), o.a*(1.-alpha) + alpha), vec4(0.), vec4(1.));

        lengthPos *= (1./_Size);

        o.rgb+= redShift*(intensity*1. + 0.5)* (1./_Steps) * 100.*distMult/(lengthPos*lengthPos);
    }  

    o.rgb = clamp(o.rgb - 0.005, 0., 1.);
    return o ;
}

void Rotate( inout vec3 vector, vec2 angle )
{
    vector.yz = cos(angle.y)*vector.yz
                +sin(angle.y)*vec2(-1,1)*vector.zy;
    vector.xz = cos(angle.x)*vector.xz
                +sin(angle.x)*vec2(-1,1)*vector.zx;
}

void main()
{
    vec2 fragCoord = v_texCoord * u_resolution;
    fragColor = vec4(0.);

    float enjoyTime = u_enjoyTime;
    float focus = 0.0;
    float implosion = 0.0;
    float explosion = 0.0;

    if (enjoyTime > 0.0) {
        // 1-4s: Focus/Zoom in
        focus = smoothstep(1.0, 4.0, enjoyTime) - smoothstep(7.0, 8.0, enjoyTime);
        // 4-6s: Implosion (Shrinking)
        implosion = smoothstep(4.0, 6.0, enjoyTime) - smoothstep(6.0, 6.5, enjoyTime);
        // 6-7s: Explosion (Expanding back)
        explosion = smoothstep(6.0, 6.5, enjoyTime) - smoothstep(7.0, 8.0, enjoyTime);
    }

    // Robust ray calculation for full-screen coverage
    vec2 uv = (fragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
    
    // Focus effect - zoom in
    uv /= (1.0 + focus * 1.5);
    
    vec3 ray = normalize(vec3(uv, 1.0)); 
    
    // Normalize mouse for camera influence
    vec2 mouse = u_mouse.xy / u_resolution.xy;
    
    // Stable camera position
    float mouseDepth = length(mouse - 0.5) * 2.0;
    vec3 pos = vec3(0.0, 0.05, -5.0 - mouseDepth * 0.5); 
    
    // Move camera closer during focus
    pos.z += focus * 1.5;

    // Slow auto-rotation combined with subtle mouse tilt
    vec2 angle = vec2(u_time * 0.05, 0.2);      
    angle.x += (mouse.x - 0.5) * 0.4;
    angle.y += (mouse.y - 0.5) * 0.2;
    
    // Spin faster during implosion
    angle.x += implosion * enjoyTime * 3.0;

    float dist = length(pos);
    Rotate(pos, angle);
    angle.xy -= min(0.3 / dist, 3.14) * vec2(1.0, 0.5);
    Rotate(ray, angle);

    vec4 col = vec4(0.0); 
    vec4 glow = vec4(0.0); 
    vec4 outCol = vec4(100.0);

    // Shrink during implosion, expand back during explosion
    float currentSize = _Size * (1.0 - implosion * 0.8);

    // Primary raymarching loop
    for(int disks = 0; disks < 20; disks++)
    {
        for (int h = 0; h < 6; h++) 
        {
            float dotpos = dot(pos, pos);
            float invDist = inversesqrt(dotpos);
            float centDist = dotpos * invDist;
            float stepDist = 0.92 * abs(pos.y / (ray.y + 0.0001)); // Avoid division by zero
            float farLimit = centDist * 0.5;
            float closeLimit = centDist * 0.1 + 0.05 * centDist * centDist * (1.0 / currentSize);
            stepDist = min(stepDist, min(farLimit, closeLimit));

            float invDistSqr = invDist * invDist;
            float bendForce = stepDist * invDistSqr * currentSize * 0.625;
            
            // Stronger gravity during implosion
            bendForce *= (1.0 + implosion * 3.0);

            ray = normalize(ray - (bendForce * invDist) * pos);
            pos += stepDist * ray; 
        }

        float dist2 = length(pos);

        if(dist2 < currentSize * 0.1)
        {
            outCol = vec4(col.rgb * col.a + glow.rgb * (1.0 - col.a), 1.0);
            break;
        }
        else if(dist2 > currentSize * 1000.0)
        {                   
            vec4 bg = background(ray);
            outCol = vec4(col.rgb * col.a + bg.rgb * (1.0 - col.a) + glow.rgb * (1.0 - col.a), 1.0);       
            break;
        }
        else if (abs(pos.y) <= currentSize * 0.002)
        {                             
            vec4 diskCol = raymarchDisk(ray, pos);
            
            // Subtle brightening during expansion instead of a blinding flash
            float flash = smoothstep(6.0, 6.2, enjoyTime) * (1.0 - smoothstep(6.5, 7.5, enjoyTime));
            diskCol.rgb *= (1.0 + flash * 1.5);

            pos.y = 0.0;
            pos += abs(currentSize * 0.001 / (ray.y + 0.0001)) * ray;  
            col = vec4(diskCol.rgb * (1.0 - col.a) + col.rgb, col.a + diskCol.a * (1.0 - col.a));
        }	
    }

    if(outCol.r == 100.0)
        outCol = vec4(col.rgb + glow.rgb * (col.a + glow.a), 1.0);

    col = outCol;
    
    // Minimal glow during expansion instead of a white flash
    float screenGlow = smoothstep(6.1, 6.3, enjoyTime) * (1.0 - smoothstep(6.5, 7.5, enjoyTime));
    col.rgb += u_discColor * screenGlow * 0.3;

    col.rgb = pow(col.rgb, vec3(0.6));

    fragColor = col; 
}
`;

      const shader = new ShaderBuilder(gl, vsource, fsource);
      shader.build();

      const quadVertices = new Float32Array([
          -1, -1,
          1, -1,
          -1, 1,
          1, 1
      ]);

      shader.createVAO('quad');
      shader.bindVAO('quad');
      shader.createVBO('quadVertices', quadVertices);
      gl.bindBuffer(gl.ARRAY_BUFFER, shader._vbos.get('quadVertices'));
      shader.setAttribute('a_position', 2, gl.FLOAT);

      let nebulaTexture: WebGLTexture | null = null;
      const loadNebulaTexture = (imageUrl: string) => {
          return new Promise((resolve, reject) => {
              const texture = gl.createTexture();
              const image = new Image();
              image.crossOrigin = "Anonymous";
              image.onload = () => {
                  function nextPowerOfTwo(x: number) {
                      return Math.pow(2, Math.ceil(Math.log2(x)));
                  }
                  const potWidth = nextPowerOfTwo(image.width);
                  const potHeight = nextPowerOfTwo(image.height);
                  const canvasPOT = document.createElement('canvas');
                  canvasPOT.width = potWidth;
                  canvasPOT.height = potHeight;
                  const ctx = canvasPOT.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(image, 0, 0, potWidth, potHeight);
                  }

                  gl.bindTexture(gl.TEXTURE_2D, texture);
                  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvasPOT);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                  gl.generateMipmap(gl.TEXTURE_2D);
                  nebulaTexture = texture;
                  resolve(texture);
              };
              image.onerror = reject;
              image.src = imageUrl;
          });
      };

      const nebulaImageUrl = 'https://images.unsplash.com/photo-1610296669228-602fa827fc1f?w=1920';
      loadNebulaTexture(nebulaImageUrl).catch(err => {
        console.error('Nebula texture failed', err);
      });

      let mousePos = { x: canvas.width / 2, y: canvas.height / 2 };
      let targetMousePos = { x: canvas.width / 2, y: canvas.height / 2 };
      
      const handleMouseMove = (e: MouseEvent) => {
        targetMousePos.x = e.clientX;
        targetMousePos.y = e.clientY;
      };
      window.addEventListener('mousemove', handleMouseMove);

      let startTime = Date.now();

      const render = () => {
          if (!isMounted) return;
          const currentTime = (Date.now() - startTime) / 1000;

          // Smooth easing for mouse movement
          mousePos.x += (targetMousePos.x - mousePos.x) * 0.05;
          mousePos.y += (targetMousePos.y - mousePos.y) * 0.05;

          // Ensure viewport matches physical pixels
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);

          shader.use();
          shader.bindVAO('quad');

          shader.setUniform1f('u_time', currentTime);
          shader.setUniform2f('u_resolution', gl.drawingBufferWidth, gl.drawingBufferHeight);
          shader.setUniform2f('u_mouse', mousePos.x, mousePos.y);

          let enjoyTime = 0;
          if (enjoyStartTimeRef.current > 0) {
              enjoyTime = (Date.now() - enjoyStartTimeRef.current) / 1000;
              if (enjoyTime > 8.0) {
                  enjoyStartTimeRef.current = 0;
                  enjoyTime = 0;
              }
          }
          shader.setUniform1f('u_enjoyTime', enjoyTime);

          if (nebulaTexture) {
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_2D, nebulaTexture);
              shader.setUniform1i('u_texture0', 0);
          }

          shader.setUniform3f('u_discColor', discColor.r, discColor.g, discColor.b);

          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

          animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    };

    init();

    return () => {
      isMounted = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 w-full h-full bg-ink-black pointer-events-none"
    />
  );
};
