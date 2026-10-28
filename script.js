import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==========================================
// RUTA DE TU MODELO 3D (.glb o .gltf)
// Modifica esta línea para cambiar el archivo
// ==========================================
const RUTA_MODELO = 'Modelos/Sopaipilla_v02.glb';

function inicializarVisor(containerId, modelPath) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // 1. ESCENA (Sin color de fondo para mantenerla transparente)
  const scene = new THREE.Scene();

  // 2. CÁMARA
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.2,
    100
  );

  // 3. RENDERIZADOR (Con alpha: true para fondo transparente)
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    precision: "mediump"
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // 4. CONTROLES INTERACTIVOS (Mouse y Táctil)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.rotateSpeed = 0.7;

  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };

  // 5. ILUMINACIÓN
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
  mainLight.position.set(4, 6, 4);
  scene.add(mainLight);

  // 6. CARGAR Y CENTRAR MODELO
  const loader = new GLTFLoader();
  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((child) => {
        if (child.isMesh) {
          child.matrixAutoUpdate = false;
          child.updateMatrix();
          if (child.material && child.material.map) {
            child.material.map.generateMipmaps = true;
            child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
          }
        }
      });

      scene.add(model);

      // Centrado automático en el origen (0,0,0) para flotar en el aire
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - center.y);
      model.position.z += (model.position.z - center.z);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.7;

      cameraZ = Math.max(cameraZ, 2.5);
      camera.position.set(0, 0, cameraZ);
      controls.target.set(0, 0, 0);
      controls.update();
    },
    undefined,
    (error) => console.error(`Error al cargar el modelo 3D desde "${modelPath}":`, error)
  );

  // LOOP DE RENDERIZADO
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // REDIMENSIONADO AUTOMÁTICO
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

// Inicializar el visor
inicializarVisor('viewport-container', RUTA_MODELO);