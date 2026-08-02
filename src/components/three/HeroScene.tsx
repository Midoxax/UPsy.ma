import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere, Stars } from "@react-three/drei";
import * as THREE from "three";

/**
 * HeroScene — cinematic 3D orb for the marketing hero.
 * - Central distorted maroon/gold sphere (the "mind under pressure, held")
 * - Orbiting gold satellites (protocols surrounding the person)
 * - Deep-space starfield backdrop
 * Mobile-safe: dpr capped, no shadows, single geometry.
 */

function OrbitingSatellites() {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.15;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
  });
  const satellites = [
    { r: 2.4, theta: 0, phi: 1.1, color: "#F2B705", size: 0.09 },
    { r: 2.6, theta: 2.1, phi: 1.4, color: "#F2B705", size: 0.07 },
    { r: 2.3, theta: 4.2, phi: 0.8, color: "#e8a87c", size: 0.06 },
    { r: 2.8, theta: 1.3, phi: 2.2, color: "#F2B705", size: 0.08 },
    { r: 2.5, theta: 3.5, phi: 1.9, color: "#c9a84c", size: 0.05 },
    { r: 2.7, theta: 5.4, phi: 1.0, color: "#F2B705", size: 0.075 },
  ];
  return (
    <group ref={group}>
      {satellites.map((s, i) => {
        const x = s.r * Math.sin(s.phi) * Math.cos(s.theta);
        const y = s.r * Math.cos(s.phi);
        const z = s.r * Math.sin(s.phi) * Math.sin(s.theta);
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[s.size, 24, 24]} />
            <meshStandardMaterial
              color={s.color}
              emissive={s.color}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CoreOrb() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.1;
    ref.current.rotation.z = state.clock.elapsedTime * 0.05;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <Sphere ref={ref} args={[1.35, 96, 96]}>
        <MeshDistortMaterial
          color="#6D0F22"
          emissive="#3D0611"
          emissiveIntensity={0.6}
          distort={0.42}
          speed={1.6}
          roughness={0.15}
          metalness={0.85}
        />
      </Sphere>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.35} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#F2B705" />
        <pointLight position={[-5, -3, -2]} intensity={0.8} color="#A3263A" />
        <Stars radius={40} depth={30} count={1500} factor={3.5} saturation={0} fade speed={0.6} />
        <CoreOrb />
        <OrbitingSatellites />
        {/*
          There was an <Environment preset="night" /> here. `preset` makes drei
          fetch an HDR environment map from raw.githack.com at runtime, and that
          fetch has never once succeeded in production: `connect-src` does not
          allow the host, so the browser blocks it on every load. Sentry logged
          it from www.upsy.ma as soon as error reporting went live.

          It was already wrapped in its own ErrorBoundary, so the scene kept
          rendering — which is why nobody noticed. The reflection map has simply
          never existed for any visitor; the orb has always been lit by the
          ambient and point lights above.

          Removing it is therefore a visual no-op that stops an error firing on
          every homepage load. The alternative — allowing raw.githack.com in the
          CSP — trades a decorative reflection for a connect-src entry to a
          service that proxies arbitrary GitHub repositories, which is a poor
          bargain on a platform holding clinical records. githack also asks not
          to be used for production traffic.

          To restore image-based lighting, self-host it: `npm i @pmndrs/assets`
          and pass `files={...}` so the HDR is served from this origin, covered
          by 'self' and dependent on nothing external.
        */}
      </Suspense>
    </Canvas>
  );
}