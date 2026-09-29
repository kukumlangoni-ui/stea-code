import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Renderer,
  Program,
  Triangle,
  Mesh,
} from "ogl";

import "./SideRays.css";

const hexToRgb = (hex) => {
  const match =
    /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
      hex
    );

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
  speed = 0.38,
  rayColor1 = "#F5A623",
  rayColor2 = "#547BFF",
  intensity = 0.58,
  spread = 1.35,
  origin = "top-right",
  tilt = -7,
  saturation = 0.82,
  blend = 0.58,
  falloff = 2.35,
  opacity = 0.34,
  className = "",
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const uniformsRef = useRef(null);
  const meshRef = useRef(null);
  const animationRef = useRef(null);

  const [visible, setVisible] =
    useState(true);

  useEffect(() => {
    const node =
      containerRef.current;

    if (!node) {
      return undefined;
    }

    if (
      typeof IntersectionObserver ===
      "undefined"
    ) {
      setVisible(true);
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setVisible(
            entry.isIntersecting
          );
        },
        {
          threshold: 0.02,
        }
      );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      !visible ||
      !containerRef.current
    ) {
      return undefined;
    }

    let destroyed = false;

    const container =
      containerRef.current;

    const renderer =
      new Renderer({
        dpr: Math.min(
          window.devicePixelRatio ||
            1,
          1.5
        ),
        alpha: true,
      });

    rendererRef.current =
      renderer;

    const gl =
      renderer.gl;

    gl.canvas.style.width =
      "100%";

    gl.canvas.style.height =
      "100%";

    gl.canvas.style.display =
      "block";

    container.innerHTML = "";

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

      float rayStrength(
        vec2 raySource,
        vec2 rayDirection,
        vec2 coord,
        float seedA,
        float seedB,
        float speedValue
      ) {
        vec2 difference =
          coord - raySource;

        float differenceLength =
          max(
            length(difference),
            0.001
          );

        float cosAngle =
          dot(
            difference /
              differenceLength,
            rayDirection
          );

        float wave1 =
          0.45 +
          0.15 *
          sin(
            cosAngle *
              seedA +
            iTime *
              speedValue
          );

        float wave2 =
          0.30 +
          0.20 *
          cos(
            -cosAngle *
              seedB +
            iTime *
              speedValue
          );

        float radial =
          clamp(
            (
              iResolution.x -
              differenceLength
            ) /
            iResolution.x,
            0.5,
            1.0
          );

        return
          clamp(
            wave1 +
              wave2,
            0.0,
            1.0
          ) *
          radial;
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

        vec2 raySource =
          vec2(
            iResolution.x *
              1.08,
            -0.42 *
              iResolution.y
          );

        float tiltRadians =
          iTilt *
          3.14159265 /
          180.0;

        float cosine =
          cos(
            tiltRadians
          );

        float sine =
          sin(
            tiltRadians
          );

        vec2 relative =
          coord -
          raySource;

        vec2 tiltedCoord =
          vec2(
            relative.x *
              cosine -
            relative.y *
              sine,

            relative.x *
              sine +
            relative.y *
              cosine
          ) +
          raySource;

        float halfSpread =
          iSpread *
          0.275;

        vec2 rayDirection1 =
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

        vec2 rayDirection2 =
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
            raySource,
            rayDirection1,
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
            raySource,
            rayDirection2,
            tiltedCoord,
            22.3991,
            18.0234,
            iSpeed *
              0.2
          );

        vec4 color =
          rays1 *
          (
            1.0 -
            iBlend
          ) *
          0.9 +
          rays2 *
          iBlend *
          0.9;

        float distanceToLight =
          length(
            fragCoord.xy -
            vec2(
              raySource.x,
              iResolution.y -
              raySource.y
            )
          ) /
          max(
            iResolution.y,
            1.0
          );

        float brightness =
          iIntensity *
          0.4 /
          pow(
            max(
              distanceToLight,
              0.001
            ),
            iFalloff
          );

        color.rgb *=
          brightness;

        float grayscale =
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
            vec3(
              grayscale
            ),
            color.rgb,
            iSaturation
          );

        color.a =
          max(
            color.r,
            max(
              color.g,
              color.b
            )
          ) *
          iOpacity;

        gl_FragColor =
          color;
      }
    `;

    const [
      flipX,
      flipY,
    ] =
      originToFlip(
        origin
      );

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
        value:
          intensity,
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
        value:
          saturation,
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
        if (
          destroyed ||
          !containerRef.current
        ) {
          return;
        }

        const width =
          container.clientWidth;

        const height =
          container.clientHeight;

        if (
          width <= 0 ||
          height <= 0
        ) {
          return;
        }

        renderer.setSize(
          width,
          height
        );

        uniforms
          .iResolution
          .value = [
            width *
              renderer.dpr,
            height *
              renderer.dpr,
          ];
      };

    const render =
      (time) => {
        if (destroyed) {
          return;
        }

        uniforms
          .iTime
          .value =
          time *
          0.001;

        renderer.render({
          scene: mesh,
        });

        animationRef.current =
          requestAnimationFrame(
            render
          );
      };

    window.addEventListener(
      "resize",
      updateSize,
      {
        passive: true,
      }
    );

    updateSize();

    animationRef.current =
      requestAnimationFrame(
        render
      );

    return () => {
      destroyed = true;

      window.removeEventListener(
        "resize",
        updateSize
      );

      if (
        animationRef.current
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }

      try {
        if (
          gl.canvas &&
          gl.canvas.parentNode
        ) {
          gl.canvas.parentNode.removeChild(
            gl.canvas
          );
        }

        const loseContext =
          gl.getExtension(
            "WEBGL_lose_context"
          );

        loseContext?.loseContext();
      } catch {
        // Safe WebGL cleanup.
      }

      rendererRef.current =
        null;

      uniformsRef.current =
        null;

      meshRef.current =
        null;
    };
  }, [
    visible,
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
      aria-hidden="true"
      className={
        `side-rays-container ${className}`.trim()
      }
    />
  );
}
