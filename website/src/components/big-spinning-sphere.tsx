type Plane = {
  x: number;
  y: number;
  z: number;
};
type Dot = {
  original: Plane;
  spherical: {
    theta: number;
    phi: number;
    r: number;
  };
  scatter: Plane;
};

export function makeBigSpinningSphere() {
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;

  let centerX = 0;
  let centerY = 0;
  const radius = 150;
  const maxDotSize = 1.5;
  const minDotSize = 0.3;

  const phiCount = 30;
  const thetaCount = 60;

  let isHovered = false;
  let isRotating = false;
  let rotationAngle = 0;
  const rotationSpeed = 0.01;

  let baseSphereProgress = 0;
  const baseScatterAmount = 0.1;

  let extraDotsActive = false;
  let extraDotsProgress = 0;
  let scatterProgress = 0;
  const maxExpansion = 1.15;
  const minCompression = 0.5;
  const extraDotsScatterAmount = 0.3;

  let baseDots: Dot[] = [];
  let extraDots: Dot[] = [];

  // Isometric angles
  const isoAngleX = Math.atan(1 / Math.sqrt(2));
  const isoAngleY = Math.PI / 4;

  function sphericalToCartesian(r: number, theta: number, phi: number) {
    let x = r * Math.sin(phi) * Math.cos(theta);
    let y = r * Math.cos(phi);
    let z = r * Math.sin(phi) * Math.sin(theta);

    // Apply Z-axis rotation
    {
      const tempX = x * Math.cos(rotationAngle) - z * Math.sin(rotationAngle); // Corrected rotation
      const tempZ = x * Math.sin(rotationAngle) + z * Math.cos(rotationAngle); // Corrected rotation
      x = tempX;
      z = tempZ;
    }

    // Apply isometric projection
    const tempX = x * Math.cos(isoAngleY) - y * Math.sin(isoAngleY);
    const tempY = x * Math.sin(isoAngleY) + y * Math.cos(isoAngleY);
    x = tempX;
    y = tempY;

    const tempY2 = y * Math.cos(isoAngleX) - z * Math.sin(isoAngleX);
    const tempZ2 = y * Math.sin(isoAngleX) + z * Math.cos(isoAngleX);
    y = tempY2;
    z = tempZ2;

    return { x, y, z };
  }

  function generateBaseDots() {
    baseDots = [];
    for (let i = 0; i < phiCount; i++) {
      const phi = (i / (phiCount - 1)) * Math.PI;
      const currentThetaCount = Math.max(
        1,
        Math.floor(Math.sin(phi) * thetaCount),
      ); // Ensure at least 1 dot

      for (let j = 0; j < currentThetaCount; j++) {
        const theta = (j / currentThetaCount) * Math.PI * 2;
        const point = sphericalToCartesian(radius, theta, phi);

        const scatter = {
          x: (Math.random() - 0.5) * 2 * baseScatterAmount * radius,
          y: (Math.random() - 0.5) * 2 * baseScatterAmount * radius,
          z: (Math.random() - 0.5) * 2 * baseScatterAmount * radius,
        };

        baseDots.push({
          spherical: {
            theta: theta,
            phi: phi,
            r: radius,
          },
          original: point,
          scatter: scatter,
        });
      }
    }
  }

  function generateExtraDots() {
    extraDots = baseDots.map((baseDot) => ({
      original: { ...baseDot.original },
      spherical: { ...baseDot.spherical },
      scatter: {
        x: (Math.random() - 0.5) * 2 * extraDotsScatterAmount * radius,
        y: (Math.random() - 0.5) * 2 * extraDotsScatterAmount * radius,
        z: (Math.random() - 0.5) * 2 * extraDotsScatterAmount * radius,
      },
    }));
  }

  function drawDot(x: number, y: number, size: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(minDotSize, size), 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();
  }

  function drawBaseSphere() {
    for (const dot of baseDots) {
      const point = sphericalToCartesian(
        dot.spherical.r,
        dot.spherical.theta,
        dot.spherical.phi,
      );
      const x = point.x + dot.scatter.x * baseSphereProgress;
      const y = point.y + dot.scatter.y * baseSphereProgress;
      const z = point.z + dot.scatter.z * baseSphereProgress;

      const scale = 1000 / (1000 + z);
      const x2d = x * scale + centerX;
      const y2d = y * scale + centerY;

      const sizeScale = Math.max(0, (z + radius) / (radius * 2));
      const dotSize = minDotSize + (maxDotSize - minDotSize) * sizeScale;

      drawDot(x2d, y2d, dotSize);
    }
  }

  function drawExtraDots() {
    if (!extraDotsActive) return;
    scatterProgress = 0;
    for (const dot of extraDots) {
      let scale: number;
      if (extraDotsProgress <= 0.5) {
        const compressProgress = extraDotsProgress;
        scale = 1 - (1 - minCompression) * (extraDotsProgress * 2);
        if (!isHovered) {
          scatterProgress = 0;
        } else {
          scatterProgress = compressProgress;
        }
      } else {
        const expandProgress = (extraDotsProgress - 0.5) * 2;
        scale =
          minCompression + (maxExpansion - minCompression) * expandProgress;
        scatterProgress = expandProgress; // Apply scatter during expansion
      }

      const point = sphericalToCartesian(
        dot.spherical.r,
        dot.spherical.theta,
        dot.spherical.phi,
      );
      const x = point.x * scale + dot.scatter.x * scatterProgress;
      const y = point.y * scale + dot.scatter.y * scatterProgress;
      const z = point.z * scale + dot.scatter.z * scatterProgress;

      const perspectiveScale = 1000 / (1000 + z);
      const x2d = x * perspectiveScale + centerX;
      const y2d = y * perspectiveScale + centerY;

      const sizeScale = Math.max(0, (z + radius) / (radius * 2));
      const dotSize = minDotSize + (maxDotSize - minDotSize) * sizeScale;

      drawDot(x2d, y2d, dotSize);
    }
  }

  function animate() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isRotating) {
      rotationAngle += rotationSpeed;
    } else {
      rotationAngle += rotationSpeed * 0.5;
    }

    // Animate base sphere scatter
    if (isHovered && baseSphereProgress < 1) {
      baseSphereProgress = Math.min(1, baseSphereProgress + 0.05);
    } else if (!isHovered && baseSphereProgress > 0) {
      baseSphereProgress = Math.max(0, baseSphereProgress - 0.05);
    }

    // Animate extra dots
    if (extraDotsActive) {
      if (isHovered) {
        extraDotsProgress = Math.min(1, extraDotsProgress + 0.02);
      } else {
        extraDotsProgress = Math.max(0, extraDotsProgress - 0.02);
        if (extraDotsProgress === 0) {
          extraDotsActive = false;
        }
      }
    }

    drawBaseSphere();
    drawExtraDots();

    requestAnimationFrame(animate);
  }

  function onmouseenter() {
    isHovered = true;
    isRotating = true;
    if (!extraDotsActive) {
      extraDotsActive = true;
      extraDotsProgress = 0;
      generateExtraDots();
    }
  }

  function onmouseleave() {
    isHovered = false;
    isRotating = false;
  }

  function onmount(_canvas: HTMLCanvasElement) {
    canvas = _canvas;
    canvas.width = window.innerWidth - 32;
    canvas.height = window.innerHeight / 2;
    ctx = _canvas.getContext('2d');
    centerX = (window.innerWidth - 32) / 2;
    centerY = window.innerHeight / 4;
    generateBaseDots();
    animate();
  }

  generateBaseDots();
  animate();
  return {
    onmouseenter,
    onmouseleave,
    onmount,
  };
}

export function BigSpinningSphere() {
  const { onmouseenter, onmouseleave, onmount } = makeBigSpinningSphere();
  return (
    <canvas
      onmouseenter={onmouseenter}
      onmouseleave={onmouseleave}
      ref={(e) => {
        onmount(e);
      }}
    />
  );
}
