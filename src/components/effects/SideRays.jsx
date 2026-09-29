import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const hexToRgb = (hex) => {
  const match =
    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return match
    ? [
        parseInt(match[1], 16) / 255,
        parseInt(match[2], 16) / 255,
        parseInt(match[3], 16) / 255,
      ]
    : [1, 1, 1];
};

const originToFlip = (origin) => {
  switch (origin) {
    case "top-left":
      return [1, 0];

    case "bottom-right":
      return [0, 1];

    case "bottom-left":
      return [1, 1];

    default:
      return [0, 0];
  }
};

export default function SideRays({
  speed = 0.7,
  rayColor1 = "#F5A623",
  rayColor2 = "#72A7FF",
  intensity = 1.45,
  spread = 1.8,
  origin = "top-right",
  tilt = -5,
  saturation = 1.2,
  blend = 0.62,
  falloff = 1.45,
  opacity = 0.8,
  className = "",
}) {
  const containerRef = useRef(null);

  const rendererRef = useRef(null);
  const uniformsRef = useRef(null);
  const meshRef = useRef(null);
  const frameRef = useRef(null);

  const pointerTargetRef = useRef({
    x: 0,
    y: 0,
  });

  const pointerSmoothRef = useRef({
    x: 0,
    y: 0,
  });

  const [isVisible, setIsVisible] =
    useState(true);

  useEffect(() => {
    const element =
      containerRef.current;

    if (!element) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setIsVisible(
            entry.isIntersecting
          );
        },
        {
          threshold: 0.04,
        }
      );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return undefined;
    }

    const hero =
      container.closest(
        ".stea-home-hero-final"
      ) || container.parentElement;

    if (!hero) {
      return undefined;
    }

    const handlePointerMove = (
      event
    ) => {
      const rect =
        hero.getBoundingClientRect();

      if (
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return;
      }

      const insideX =
        event.clientX >= rect.left &&
        event.clientX <= rect.right;

      const insideY =
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!insideX || !insideY) {
        return;
      }

      const x =
        (event.clientX -
          rect.left) /
        rect.width;

      const y =
        (event.clientY -
          rect.top) /
        rect.height;

      pointerTargetRef.current.x =
        (x - 0.5) * 2;

      pointerTargetRef.current.y =
        (y - 0.5) * 2;
    };

    const handlePointerLeave =
      () => {
        pointerTargetRef.current.x =
          0;

        pointerTargetRef.current.y =
          0;
      };

    hero.addEventListener(
      "pointermove",
      handlePointerMove,
      {
        passive: true,
      }
    );

    hero.addEventListener(
      "pointerleave",
      handlePointerLeave
    );

    return () => {
      hero.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      hero.removeEventListener(
        "pointerleave",
        handlePointerLeave
      );
    };
  }, []);

  useEffect(() => {
    const container =
      containerRef.current;

    if (
      !container ||
      !isVisible
    ) {
      return undefined;
    }

    const renderer =
      new Renderer({
        alpha: true,
        antialias: false,
        dpr: Math.min(
          window.devicePixelRatio ||
            1,
          1.75
        ),
      });

    rendererRef.current =
      renderer;

    const gl = renderer.gl;

    gl.clearColor(
      0,
      0,
      0,
      0
    );

    gl.canvas.style.width =
      "100%";

    gl.canvas.style.height =
      "100%";

    gl.canvas.style.display =
      "block";

    while (
      container.firstChild
    ) {
      container.removeChild(
        container.firstChild
      );
    }

    container.appendChild(
      gl.canvas
    );

    const vertex = `
      attribute vec2 position;

      void main() {
        gl_Position =
          vec4(
            position,
            0.0,
            1.0
          );
      }
    `;

    const fragment = `
      precision highp float;

      uniform float iTime;
      uniform vec2 iResolution;

      uniform float iSpeed;

      uniform vec3 iRayColor1;
      uniform vec3 iRayColor2;

      uniform float iIntensity;
      uniform float iSpread;

      uniform float iFlipX;
      uniform float iFlipY;

      uniform float iTilt;
      uniform float iSaturation;
      uniform float iBlend;
      uniform float iFalloff;
      uniform float iOpacity;

      uniform vec2 iPointer;

      float hash(float n) {
        return fract(
          sin(n) *
          43758.5453123
        );
      }

      float rayStrength(
        vec2 source,
        vec2 direction,
        vec2 coord,
        float seedA,
        float seedB,
        float localSpeed
      ) {
        vec2 vector =
          coord - source;

        float distanceValue =
          max(
            length(vector),
            0.001
          );

        vec2 normalizedVector =
          vector /
          distanceValue;

        float angle =
          dot(
            normalizedVector,
            direction
          );

        float waveA =
          sin(
            angle *
              seedA +
            iTime *
              localSpeed +
            sin(
              iTime *
                0.17
            ) *
              0.75
          );

        float waveB =
          cos(
            -angle *
              seedB +
            iTime *
              localSpeed *
              0.72
          );

        float microWave =
          sin(
            angle *
              (
                seedA +
                seedB
              ) *
              0.48 -
            iTime *
              localSpeed *
              0.36
          );

        float movingEnergy =
          0.46 +
          waveA *
            0.18 +
          waveB *
            0.19 +
          microWave *
            0.09;

        float directionalFocus =
          smoothstep(
            0.15,
            0.98,
            angle
          );

        float distanceFade =
          clamp(
            (
              iResolution.x *
                1.25 -
              distanceValue
            ) /
              (
                iResolution.x *
                1.25
              ),
            0.12,
            1.0
          );

        return
          clamp(
            movingEnergy,
            0.0,
            1.0
          ) *
          directionalFocus *
          distanceFade;
      }

      void main() {
        vec2 fragCoord =
          gl_FragCoord.xy;

        if (
          iFlipX >
          0.5
        ) {
          fragCoord.x =
            iResolution.x -
            fragCoord.x;
        }

        if (
          iFlipY >
          0.5
        ) {
          fragCoord.y =
            iResolution.y -
            fragCoord.y;
        }

        vec2 coord =
          vec2(
            fragCoord.x,
            iResolution.y -
              fragCoord.y
          );

        float breathing =
          sin(
            iTime *
            0.38
          ) *
          0.5 +
          0.5;

        vec2 pointerOffset =
          vec2(
            iPointer.x *
              iResolution.x *
              0.34,
            -iPointer.y *
              iResolution.y *
              0.24
          );

        vec2 rayPos =
          vec2(
            iResolution.x *
              (
                1.02 +
                breathing *
                  0.035
              ),
            -iResolution.y *
              (
                0.35 +
                breathing *
                  0.08
              )
          ) +
          pointerOffset;

        float tiltMotion =
          sin(
            iTime *
            0.22
          ) *
          2.4;

        float tiltRad =
          (
            iTilt +
            tiltMotion +
            iPointer.x * 10.0 +
            iPointer.y * 4.0
          ) *
          3.14159265 /
          180.0;

        float cs =
          cos(tiltRad);

        float sn =
          sin(tiltRad);

        vec2 relativeCoord =
          coord - rayPos;

        vec2 tiltedCoord =
          vec2(
            relativeCoord.x *
              cs -
            relativeCoord.y *
              sn,
            relativeCoord.x *
              sn +
            relativeCoord.y *
              cs
          ) +
          rayPos;

        float spreadMotion =
          sin(
            iTime *
            0.31
          ) *
          0.06;

        float halfSpread =
          (
            iSpread +
            spreadMotion +
            abs(iPointer.x) * 0.18 +
            abs(iPointer.y) * 0.10
          ) *
          0.275;

        vec2 direction1 =
          normalize(
            vec2(
              cos(
                0.785398 +
                halfSpread
              ),
              sin(
                0.785398 +
                halfSpread
              )
            )
          );

        vec2 direction2 =
          normalize(
            vec2(
              cos(
                0.785398 -
                halfSpread
              ),
              sin(
                0.785398 -
                halfSpread
              )
            )
          );

        vec4 rays1 =
          vec4(
            iRayColor1,
            1.0
          ) *
          rayStrength(
            rayPos,
            direction1,
            tiltedCoord,
            36.2214,
            21.11349,
            iSpeed
          );

        vec4 rays2 =
          vec4(
            iRayColor2,
            1.0
          ) *
          rayStrength(
            rayPos,
            direction2,
            tiltedCoord,
            22.3991,
            18.0234,
            iSpeed *
              0.46
          );

        vec2 middleDirection =
          normalize(
            direction1 +
            direction2
          );

        vec4 centerRay =
          vec4(
            mix(
              iRayColor1,
              iRayColor2,
              0.5
            ),
            1.0
          ) *
          rayStrength(
            rayPos,
            middleDirection,
            tiltedCoord,
            28.2,
            15.8,
            iSpeed *
              0.66
          ) *
          0.32;

        vec4 color =
          rays1 *
            (
              1.0 -
              iBlend
            ) *
            1.12 +
          rays2 *
            iBlend *
            1.08 +
          centerRay;

        float distanceToLight =
          length(
            fragCoord.xy -
            vec2(
              rayPos.x,
              iResolution.y -
                rayPos.y
            )
          ) /
          iResolution.y;

        float brightness =
          iIntensity *
          0.36 /
          pow(
            max(
              distanceToLight,
              0.12
            ),
            iFalloff
          );

        float pulse =
          0.91 +
          sin(
            iTime *
              0.55
          ) *
            0.09;

        color.rgb *=
          brightness *
          pulse;

        float gray =
          dot(
            color.rgb,
            vec3(
              0.299,
              0.587,
              0.114
            )
          );

        color.rgb =
          mix(
            vec3(gray),
            color.rgb,
            iSaturation
          );

        float alpha =
          max(
            color.r,
            max(
              color.g,
              color.b
            )
          );

        color.a =
          alpha *
          iOpacity;

        gl_FragColor =
          color;
      }
    `;

    const [
      flipX,
      flipY,
    ] =
      originToFlip(origin);

    const uniforms = {
      iTime: {
        value: 0,
      },

      iResolution: {
        value: [1, 1],
      },

      iSpeed: {
        value: speed,
      },

      iRayColor1: {
        value:
          hexToRgb(
            rayColor1
          ),
      },

      iRayColor2: {
        value:
          hexToRgb(
            rayColor2
          ),
      },

      iIntensity: {
        value: intensity,
      },

      iSpread: {
        value: spread,
      },

      iFlipX: {
        value: flipX,
      },

      iFlipY: {
        value: flipY,
      },

      iTilt: {
        value: tilt,
      },

      iSaturation: {
        value: saturation,
      },

      iBlend: {
        value: blend,
      },

      iFalloff: {
        value: falloff,
      },

      iOpacity: {
        value: opacity,
      },

      iPointer: {
        value: [0, 0],
      },
    };

    uniformsRef.current =
      uniforms;

    const geometry =
      new Triangle(gl);

    const program =
      new Program(gl, {
        vertex,
        fragment,
        uniforms,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

    const mesh =
      new Mesh(gl, {
        geometry,
        program,
      });

    meshRef.current =
      mesh;

    const updateSize =
      () => {
        const currentContainer =
          containerRef.current;

        if (
          !currentContainer
        ) {
          return;
        }

        const width =
          Math.max(
            currentContainer
              .clientWidth,
            1
          );

        const height =
          Math.max(
            currentContainer
              .clientHeight,
            1
          );

        renderer.setSize(
          width,
          height
        );

        uniforms.iResolution.value =
          [
            width *
              renderer.dpr,
            height *
              renderer.dpr,
          ];
      };

    const resizeObserver =
      new ResizeObserver(
        updateSize
      );

    resizeObserver.observe(
      container
    );

    updateSize();

    const render = (
      time
    ) => {
      const smooth =
        pointerSmoothRef.current;

      const target =
        pointerTargetRef.current;

      smooth.x +=
        (
          target.x -
          smooth.x
        ) *
        0.085;

      smooth.y +=
        (
          target.y -
          smooth.y
        ) *
        0.085;

      uniforms.iPointer.value =
        [
          smooth.x,
          smooth.y,
        ];

      uniforms.iTime.value =
        time *
        0.001;

      renderer.render({
        scene: mesh,
      });

      frameRef.current =
        requestAnimationFrame(
          render
        );
    };

    frameRef.current =
      requestAnimationFrame(
        render
      );

    return () => {
      resizeObserver.disconnect();

      if (
        frameRef.current
      ) {
        cancelAnimationFrame(
          frameRef.current
        );

        frameRef.current =
          null;
      }

      try {
        const loseContext =
          gl.getExtension(
            "WEBGL_lose_context"
          );

        loseContext?.loseContext();
      } catch {
        // no-op
      }

      if (
        gl.canvas.parentNode
      ) {
        gl.canvas.parentNode.removeChild(
          gl.canvas
        );
      }

      rendererRef.current =
        null;

      uniformsRef.current =
        null;

      meshRef.current =
        null;
    };
  }, [
    isVisible,
    speed,
    rayColor1,
    rayColor2,
    intensity,
    spread,
    origin,
    tilt,
    saturation,
    blend,
    falloff,
    opacity,
  ]);

  return (
    <div
      ref={containerRef}
      className={
        `side-rays-container ${className}`.trim()
      }
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}
