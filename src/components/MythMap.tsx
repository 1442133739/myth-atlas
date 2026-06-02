import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import landTopo from "world-atlas/land-110m.json";
import { feature } from "topojson-client";
import type { Story } from "../types";

interface MythMapProps {
  stories: Story[];
  selectedStory?: Story;
  relatedStories: Story[];
  showLabels: boolean;
  showConnections: boolean;
  onSelectStory: (id: string) => void;
}

type GlobeLabel = { id: string; name: string; lat: number; lng: number; kind: "continent" | "ocean" };
type ProjectablePoint = { id: string; lat: number; lng: number; radius: number };
type ScreenProjection = { id: string; x: number; y: number; visible: boolean; scale: number; frontFactor: number };

const globeRadius = 2;

const globeLabels: GlobeLabel[] = [
  { id: "asia", name: "亚洲", lat: 34, lng: 88, kind: "continent" },
  { id: "europe", name: "欧洲", lat: 52, lng: 16, kind: "continent" },
  { id: "africa", name: "非洲", lat: 3, lng: 20, kind: "continent" },
  { id: "north-america", name: "北美洲", lat: 46, lng: -103, kind: "continent" },
  { id: "south-america", name: "南美洲", lat: -18, lng: -60, kind: "continent" },
  { id: "oceania", name: "大洋洲", lat: -25, lng: 135, kind: "continent" },
  { id: "antarctica", name: "南极洲", lat: -74, lng: 20, kind: "continent" },
  { id: "pacific", name: "太平洋", lat: 2, lng: -155, kind: "ocean" },
  { id: "atlantic", name: "大西洋", lat: 10, lng: -35, kind: "ocean" },
  { id: "indian", name: "印度洋", lat: -20, lng: 75, kind: "ocean" },
  { id: "arctic", name: "北冰洋", lat: 78, lng: -20, kind: "ocean" }
];

const getLandFeature = () => {
  const topo = landTopo as unknown as { objects: { land: unknown } };
  return feature(topo as never, topo.objects.land as never) as unknown as {
    type: "FeatureCollection";
    features: Array<{
      geometry: {
        type: "MultiPolygon" | "Polygon";
        coordinates: number[][][][] | number[][][];
      };
    }>;
  };
};

const projectTexturePoint = (lng: number, lat: number, width: number, height: number) => [
  ((lng + 180) / 360) * width,
  ((90 - lat) / 180) * height
];

const forEachLandRing = (callback: (ring: number[][]) => void) => {
  const land = getLandFeature();
  for (const item of land.features) {
    const polygons =
      item.geometry.type === "Polygon"
        ? [item.geometry.coordinates as number[][][]]
        : (item.geometry.coordinates as number[][][][]);

    for (const polygon of polygons) {
      for (const ring of polygon) {
        if (ring.length >= 3) callback(ring);
      }
    }
  }
};

const drawLandPaths = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  forEachLandRing((ring) => {
    ctx.beginPath();
    ring.forEach(([lng, lat], index) => {
      const [x, y] = projectTexturePoint(lng, lat, width, height);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
};

const themeColor: Record<Story["theme"], string> = {
  sun: "#facc15",
  flood: "#38bdf8",
  fire: "#fb7185",
  dragon: "#34d399",
  love: "#f472b6",
  moon: "#c4b5fd",
  underworld: "#a1a1aa",
  hero: "#f59e0b",
  creation: "#86efac"
};

const latLngToVector = (lat: number, lng: number, radius = globeRadius) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const setLatLngToVector = (target: THREE.Vector3, lat: number, lng: number, radius = globeRadius) => {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const makeEarthTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  const ocean = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  ocean.addColorStop(0, "#061727");
  ocean.addColorStop(0.33, "#082943");
  ocean.addColorStop(0.62, "#0d4260");
  ocean.addColorStop(1, "#04131f");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let lat = -75; lat <= 75; lat += 15) {
    const y = ((90 - lat) / 180) * canvas.height;
    ctx.strokeStyle = "rgba(125, 211, 252, 0.055)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  for (let lng = -180; lng <= 180; lng += 20) {
    const x = ((lng + 180) / 360) * canvas.width;
    ctx.strokeStyle = "rgba(125, 211, 252, 0.045)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  ctx.save();
  ctx.fillStyle = "#6f5b35";
  ctx.strokeStyle = "rgba(255, 242, 185, 0.38)";
  ctx.lineWidth = 1.4;
  drawLandPaths(ctx, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  const landShade = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  landShade.addColorStop(0, "rgba(163, 112, 48, 0.58)");
  landShade.addColorStop(0.34, "rgba(91, 126, 72, 0.42)");
  landShade.addColorStop(0.68, "rgba(176, 137, 70, 0.44)");
  landShade.addColorStop(1, "rgba(50, 89, 72, 0.38)");
  ctx.fillStyle = landShade;
  ctx.strokeStyle = "rgba(255, 255, 255, 0)";
  drawLandPaths(ctx, canvas.width, canvas.height);
  ctx.restore();

  const ranges = [
    [[-165, 63], [-140, 57], [-120, 46], [-105, 35], [-98, 25]],
    [[-78, 10], [-76, -8], [-72, -20], [-70, -36], [-72, -52]],
    [[70, 34], [78, 31], [86, 29], [94, 30], [102, 32]],
    [[5, 45], [10, 46], [15, 47]],
    [[28, -12], [31, -20], [29, -29]],
    [[135, -18], [145, -25], [150, -35]],
    [[35, 38], [43, 40], [52, 36]]
  ];
  for (const range of ranges) {
    ctx.beginPath();
    range.forEach(([lng, lat], index) => {
      const [x, y] = projectTexturePoint(lng, lat, canvas.width, canvas.height);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "rgba(242, 220, 166, 0.72)";
    ctx.lineWidth = 4;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  for (let i = 0; i < 2400; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const warm = Math.random() > 0.48;
    ctx.fillStyle = warm ? "rgba(232, 194, 116, 0.10)" : "rgba(102, 158, 105, 0.09)";
    ctx.fillRect(x, y, Math.random() * 2 + 0.4, Math.random() * 2 + 0.4);
  }

  for (let i = 0; i < 900; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(125,211,252,0.14)" : "rgba(34,211,238,0.08)";
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const makeBumpTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#777";
  ctx.strokeStyle = "#555";
  ctx.lineWidth = 1;
  drawLandPaths(ctx, canvas.width, canvas.height);

  const ranges = [
    [[-165, 63], [-140, 57], [-120, 46], [-105, 35], [-98, 25]],
    [[-78, 10], [-76, -8], [-72, -20], [-70, -36], [-72, -52]],
    [[70, 34], [78, 31], [86, 29], [94, 30], [102, 32]],
    [[5, 45], [10, 46], [15, 47]],
    [[28, -12], [31, -20], [29, -29]],
    [[135, -18], [145, -25], [150, -35]],
    [[35, 38], [43, 40], [52, 36]]
  ];
  ctx.strokeStyle = "#e8e8e8";
  ctx.lineWidth = 8;
  for (const range of ranges) {
    ctx.beginPath();
    range.forEach(([lng, lat], index) => {
      const [x, y] = projectTexturePoint(lng, lat, canvas.width, canvas.height);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  for (let i = 0; i < 3200; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const value = Math.floor(82 + Math.random() * 72);
    ctx.fillStyle = `rgb(${value},${value},${value})`;
    ctx.fillRect(x, y, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  return texture;
};

const makeLandLayer = () => {
  const group = new THREE.Group();
  const topo = landTopo as unknown as { objects: { land: unknown } };
  const land = feature(topo as never, topo.objects.land as never) as unknown as {
    type: "FeatureCollection";
    features: Array<{
      geometry: {
        type: "MultiPolygon" | "Polygon";
        coordinates: number[][][][] | number[][][];
      };
    }>;
  };
  const lineMaterial = new THREE.LineBasicMaterial({
    color: "#f8e7a2",
    transparent: true,
    opacity: 0.58
  });
  const shadowMaterial = new THREE.LineBasicMaterial({
    color: "#38bdf8",
    transparent: true,
    opacity: 0.16
  });

  for (const item of land.features) {
    const polygons =
      item.geometry.type === "Polygon"
        ? [item.geometry.coordinates as number[][][]]
        : (item.geometry.coordinates as number[][][][]);

    for (const polygon of polygons) {
      for (const ring of polygon) {
        if (ring.length < 3) continue;
        const points = ring.map(([lng, lat]) => latLngToVector(lat, lng, globeRadius + 0.018));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
        const shadowPoints = ring.map(([lng, lat]) => latLngToVector(lat, lng, globeRadius + 0.012));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(shadowPoints), shadowMaterial));
      }
    }
  }

  return group;
};

const makeGlowTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 118);
  gradient.addColorStop(0, "rgba(125,211,252,0.36)");
  gradient.addColorStop(0.45, "rgba(56,189,248,0.16)");
  gradient.addColorStop(1, "rgba(56,189,248,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
};

const makeGraticule = () => {
  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({
    color: "#7dd3fc",
    transparent: true,
    opacity: 0.16
  });

  for (let lat = -60; lat <= 60; lat += 30) {
    const points: THREE.Vector3[] = [];
    for (let lng = -180; lng <= 180; lng += 4) {
      points.push(latLngToVector(lat, lng, globeRadius + 0.006));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  for (let lng = -180; lng < 180; lng += 30) {
    const points: THREE.Vector3[] = [];
    for (let lat = -85; lat <= 85; lat += 4) {
      points.push(latLngToVector(lat, lng, globeRadius + 0.006));
    }
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
  }

  return group;
};

const makeArc = (from: Story, to: Story, selected: boolean) => {
  const start = latLngToVector(from.lat, from.lng, globeRadius + 0.035);
  const end = latLngToVector(to.lat, to.lng, globeRadius + 0.035);
  const mid = start.clone().add(end).normalize().multiplyScalar(globeRadius + (selected ? 0.7 : 0.45));
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const material = new THREE.LineBasicMaterial({
    color: themeColor[from.theme],
    transparent: true,
    opacity: selected ? 0.68 : 0.2
  });
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(42)), material);
};

export function MythMap({
  stories,
  selectedStory,
  relatedStories,
  showLabels,
  showConnections,
  onSelectStory
}: MythMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const arcGroupRef = useRef<THREE.Group | null>(null);
  const animationRef = useRef<number | null>(null);
  const markerRefs = useRef(new Map<string, HTMLButtonElement>());
  const labelRefs = useRef(new Map<string, HTMLSpanElement>());
  const viewportSizeRef = useRef({ width: 1, height: 1 });
  const scratchVectorRef = useRef(new THREE.Vector3());
  const scratchWorldRef = useRef(new THREE.Vector3());
  const scratchProjectedRef = useRef(new THREE.Vector3());
  const cameraDirectionRef = useRef(new THREE.Vector3());
  const storyPointsRef = useRef<ProjectablePoint[]>([]);
  const labelPointsRef = useRef<ProjectablePoint[]>([]);
  const visibleMarkerIdsRef = useRef(new Set<string>());
  const frameCounterRef = useRef(0);

  const storyLookup = useMemo(() => new Map(stories.map((story) => [story.id, story])), [stories]);
  const storyPoints = useMemo<ProjectablePoint[]>(
    () => stories.map((story) => ({ id: story.id, lat: story.lat, lng: story.lng, radius: globeRadius + 0.1 })),
    [stories]
  );
  const labelPoints = useMemo<ProjectablePoint[]>(
    () => globeLabels.map((label) => ({ id: label.id, lat: label.lat, lng: label.lng, radius: globeRadius + 0.04 })),
    []
  );

  useEffect(() => {
    storyPointsRef.current = storyPoints;
  }, [storyPoints]);

  useEffect(() => {
    labelPointsRef.current = labelPoints;
  }, [labelPoints]);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.8, 5.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.055;
    controls.enablePan = false;
    controls.minDistance = 3.25;
    controls.maxDistance = 8;
    controls.rotateSpeed = 0.58;
    controls.zoomSpeed = 0.82;

    const globeGroup = new THREE.Group();
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(globeRadius, 64, 64),
      new THREE.MeshStandardMaterial({
        map: makeEarthTexture(),
        bumpMap: makeBumpTexture(),
        bumpScale: 0.085,
        color: "#ffffff",
        roughness: 0.92,
        metalness: 0.02,
        emissive: "#07131b",
        emissiveIntensity: 0.28
      })
    );
    globeGroup.add(earth);
    globeGroup.add(makeGraticule());

    const atmosphere = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        color: "#67e8f9",
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    atmosphere.scale.set(5.4, 5.4, 1);
    scene.add(atmosphere);
    scene.add(globeGroup);

    const arcGroup = new THREE.Group();
    scene.add(arcGroup);

    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(
          Array.from({ length: 520 }, () => (Math.random() - 0.5) * 18),
          3
        )
      ),
      new THREE.PointsMaterial({
        color: "#fff7d6",
        size: 0.012,
        transparent: true,
        opacity: 0.8
      })
    );
    scene.add(stars);

    scene.add(new THREE.AmbientLight("#9ddcff", 1.2));
    const sunLight = new THREE.DirectionalLight("#ffe7a3", 2.6);
    sunLight.position.set(4, 2.5, 5);
    scene.add(sunLight);

    rendererRef.current = renderer;
    cameraRef.current = camera;
    sceneRef.current = scene;
    controlsRef.current = controls;
    globeGroupRef.current = globeGroup;
    arcGroupRef.current = arcGroup;

    const updateSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      viewportSizeRef.current = { width, height };
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const getProjection = (point: ProjectablePoint, cameraDirection: THREE.Vector3): ScreenProjection => {
      const { width, height } = viewportSizeRef.current;
      const localPoint = setLatLngToVector(scratchVectorRef.current, point.lat, point.lng, point.radius);
      const worldPoint = scratchWorldRef.current.copy(localPoint).applyMatrix4(globeGroup.matrixWorld);
      const frontFactor = scratchProjectedRef.current.copy(worldPoint).normalize().dot(cameraDirection);
      const projected = scratchProjectedRef.current.copy(worldPoint).project(camera);
      const x = ((projected.x + 1) / 2) * width;
      const y = ((-projected.y + 1) / 2) * height;
      const visible = projected.z < 1 && frontFactor > -0.08;
      const scale = THREE.MathUtils.clamp(0.72 + frontFactor * 0.45, 0.48, 1.18);
      return { id: point.id, x, y, visible, scale, frontFactor };
    };

    const applyProjection = (projection: ScreenProjection, element: HTMLElement, oceanLabel = false) => {
      element.style.transform = `translate3d(${projection.x}px, ${projection.y}px, 0) translate(-50%, -50%) scale(${projection.scale})`;
      element.style.opacity = projection.visible ? (oceanLabel ? "0.46" : "1") : "0";
      element.style.pointerEvents = projection.visible && !oceanLabel ? "auto" : "none";
    };

    const hideMarker = (id: string) => {
      const element = markerRefs.current.get(id);
      if (!element) return;
      element.style.opacity = "0";
      element.style.pointerEvents = "none";
    };

    const animate = () => {
      controls.update();
      stars.rotation.y += 0.00028;
      renderer.render(scene, camera);

      globeGroup.updateMatrixWorld();
      frameCounterRef.current += 1;
      if (frameCounterRef.current % 2 === 0) {
        const cameraDirection = cameraDirectionRef.current.copy(camera.position).normalize();
        const visibleCandidates: ScreenProjection[] = [];
        for (const point of storyPointsRef.current) {
          const projection = getProjection(point, cameraDirection);
          if (projection.visible) visibleCandidates.push(projection);
        }

        visibleCandidates.sort((a, b) => b.frontFactor - a.frontFactor);
        const selectedProjection = selectedStory
          ? visibleCandidates.find((candidate) => candidate.id === selectedStory.id)
          : undefined;
        const activeCandidates = visibleCandidates.slice(0, 120);
        if (selectedProjection && !activeCandidates.some((candidate) => candidate.id === selectedProjection.id)) {
          activeCandidates.push(selectedProjection);
        }

        const nextVisibleIds = new Set<string>();
        for (const projection of activeCandidates) {
          const element = markerRefs.current.get(projection.id);
          if (!element) continue;
          applyProjection(projection, element);
          nextVisibleIds.add(projection.id);
        }
        for (const id of visibleMarkerIdsRef.current) {
          if (!nextVisibleIds.has(id)) hideMarker(id);
        }
        visibleMarkerIdsRef.current = nextVisibleIds;

        for (const point of labelPointsRef.current) {
          const element = labelRefs.current.get(point.id);
          if (!element) continue;
          applyProjection(getProjection(point, cameraDirection), element, element.classList.contains("ocean"));
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", updateSize);
    updateSize();
    animate();

    return () => {
      window.removeEventListener("resize", updateSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
      globeGroupRef.current = null;
      arcGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const arcGroup = arcGroupRef.current;
    if (!arcGroup) return;
    arcGroup.clear();
    if (!showConnections) return;

    const pairs: Array<[Story, Story]> = [];
    if (selectedStory) {
      relatedStories.forEach((story) => pairs.push([selectedStory, story]));
    } else {
      for (const story of stories) {
        for (const id of story.relatedStoryIds) {
          const target = storyLookup.get(id);
          if (target && story.id < target.id && (story.theme === target.theme || pairs.length < 28)) {
            pairs.push([story, target]);
          }
        }
      }
    }

    pairs.slice(0, selectedStory ? 10 : 72).forEach(([from, to]) => {
      arcGroup.add(makeArc(from, to, Boolean(selectedStory)));
    });
  }, [relatedStories, selectedStory, showConnections, stories, storyLookup]);

  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls || !selectedStory) return;

    const start = camera.position.clone();
    const target = latLngToVector(selectedStory.lat, selectedStory.lng, 5.1);
    const startedAt = performance.now();
    const duration = 850;

    const fly = (now: number) => {
      const t = THREE.MathUtils.clamp((now - startedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.copy(start.clone().lerp(target, eased));
      controls.update();
      if (t < 1) requestAnimationFrame(fly);
    };

    requestAnimationFrame(fly);
  }, [selectedStory]);

  return (
    <div className="map-stage globe-stage">
      <div className="starfield" />
      <div className="aurora-lines" />
      <div ref={containerRef} className="globe-container" />
      <div className="globe-hint">拖拽旋转 / 滚轮缩放 / 点击故事光点</div>
      <div className="geo-label-layer">
        {globeLabels.map((label) => {
          return (
            <span
              className={`geo-label ${label.kind}`}
              key={label.id}
              ref={(element) => {
                if (element) labelRefs.current.set(label.id, element);
                else labelRefs.current.delete(label.id);
              }}
            >
              {label.name}
            </span>
          );
        })}
      </div>
      <div className="globe-marker-layer">
        {stories.map((story) => {
          return (
            <button
              className={`globe-marker ${selectedStory?.id === story.id ? "selected" : ""}`}
              key={story.id}
              onClick={() => onSelectStory(story.id)}
              ref={(element) => {
                if (element) markerRefs.current.set(story.id, element);
                else markerRefs.current.delete(story.id);
              }}
              style={{
                "--marker-color": themeColor[story.theme],
                opacity: 0,
                pointerEvents: "none"
              } as CSSProperties}
              type="button"
            >
              <span className="marker-emoji">{story.icon}</span>
              {showLabels && <span className="marker-label">{story.titleZh}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
