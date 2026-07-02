"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

interface WebGLShaderProps {
  className?: string
  xScale?: number      // Frequency/density of waves
  yScale?: number      // Height of waves
  distortion?: number  // Chromatic aberration (RGB split) offset
  speed?: number       // Animation speed multiplier
}

export function WebGLShader({
  className = "fixed top-0 left-0 w-full h-full block",
  xScale = 1.0,
  yScale = 0.5,
  distortion = 0.05,
  speed = 0.01
}: WebGLShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene | null
    camera: THREE.OrthographicCamera | null
    renderer: THREE.WebGLRenderer | null
    mesh: THREE.Mesh | null
    uniforms: any
    animationId: number | null
  }>({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const { current: refs } = sceneRef
    let isVisible = true

    // Set up Intersection Observer to pause rendering when out of viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
      },
      { threshold: 0.01 }
    )
    observer.observe(canvas)

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;
      uniform vec2 resolution;
      uniform float time;
      uniform float xScale;
      uniform float yScale;
      uniform float distortion;

      void main() {
        vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
        
        float d = length(p) * distortion;
        
        float rx = p.x * (1.0 + d);
        float gx = p.x;
        float bx = p.x * (1.0 - d);

        float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
        float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
        float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);
        
        float alpha = clamp(max(r, max(g, b)), 0.0, 1.0);
        gl_FragColor = vec4(r, g, b, alpha);
      }
    `

    const initScene = () => {
      try {
        refs.scene = new THREE.Scene()
        refs.renderer = new THREE.WebGLRenderer({ canvas, alpha: true })

        // Cap the pixel ratio to 2 for maximum GPU performance on Retina screens
        refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        refs.renderer.setClearColor(new THREE.Color(0x000000), 0)

        refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

        refs.uniforms = {
          resolution: { value: [window.innerWidth, window.innerHeight] },
          time: { value: 0.0 },
          xScale: { value: xScale },
          yScale: { value: yScale },
          distortion: { value: distortion },
        }

        const position = [
          -1.0, -1.0, 0.0,
          1.0, -1.0, 0.0,
          -1.0, 1.0, 0.0,
          1.0, -1.0, 0.0,
          -1.0, 1.0, 0.0,
          1.0, 1.0, 0.0,
        ]

        const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute("position", positions)

        const material = new THREE.RawShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: refs.uniforms,
          side: THREE.DoubleSide,
        })

        refs.mesh = new THREE.Mesh(geometry, material)
        refs.scene.add(refs.mesh)

        handleResize()
      } catch (error) {
        console.warn("WebGL is not supported or failed to initialize in this browser. Skipping WebGL shader animation.", error)
        refs.renderer = null
      }
    }

    const animate = () => {
      if (isVisible) {
        if (refs.uniforms) refs.uniforms.time.value += speed
        if (refs.renderer && refs.scene && refs.camera) {
          refs.renderer.render(refs.scene, refs.camera)
        }
      }
      refs.animationId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return
      const width = window.innerWidth
      const height = window.innerHeight
      refs.renderer.setSize(width, height, false)
      refs.uniforms.resolution.value = [width, height]
    }

    initScene()
    animate()
    window.addEventListener("resize", handleResize)

    return () => {
      observer.disconnect()
      if (refs.animationId) cancelAnimationFrame(refs.animationId)
      window.removeEventListener("resize", handleResize)
      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()
        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }
      refs.renderer?.dispose()
    }
  }, [xScale, yScale, distortion, speed])

  return (
    <canvas
      ref={canvasRef}
      className={className}
    />
  )
}
