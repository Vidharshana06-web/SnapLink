import { useEffect, useRef } from "react";

const InteractiveAuthBg = () => {
  const canvasRef = useRef(null);
  
  // Track mouse states in a ref to avoid re-renders
  const mouseState = useRef({
    x: -1000,
    y: -1000,
    targetX: -1000,
    targetY: -1000,
    lastSpawnX: 0,
    lastSpawnY: 0,
    isIdle: true,
    idleTimer: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = window.devicePixelRatio || 1;

    // Theme colors
    const colors = [
      "rgba(99, 102, 241, opacity)",  // Indigo
      "rgba(124, 58, 237, opacity)", // Violet
      "rgba(6, 182, 212, opacity)",  // Cyan
    ];

    const getRandomColor = (opacity) => {
      const randomBase = colors[Math.floor(Math.random() * colors.length)];
      return randomBase.replace("opacity", opacity.toString());
    };

    // Resize handler
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Initial mouse placement
    mouseState.current.x = width / 2;
    mouseState.current.y = height / 2;
    mouseState.current.targetX = width / 2;
    mouseState.current.targetY = height / 2;

    // Ambient floating background particles
    const ambientParticles = [];
    const numAmbient = 28;
    for (let i = 0; i < numAmbient; i++) {
      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2.2 + 1.2,
        color: getRandomColor(Math.random() * 0.12 + 0.08),
      });
    }

    // Interactive particles arrays
    let splashParticles = [];
    let clickRipples = [];

    // Track mouse movement
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouseState.current.targetX = x;
      mouseState.current.targetY = y;
      mouseState.current.isIdle = false;

      // Reset idle timer
      if (mouseState.current.idleTimer) {
        clearTimeout(mouseState.current.idleTimer);
      }
      mouseState.current.idleTimer = setTimeout(() => {
        mouseState.current.isIdle = true;
      }, 3000);

      // Spawn splash particles if mouse moved enough
      const dx = x - mouseState.current.lastSpawnX;
      const dy = y - mouseState.current.lastSpawnY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 8) {
        // Spawn 1-2 particles
        const count = Math.random() > 0.5 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          if (splashParticles.length < 120) {
            splashParticles.push({
              x: x + (Math.random() - 0.5) * 6,
              y: y + (Math.random() - 0.5) * 6,
              vx: (Math.random() - 0.5) * 1.8,
              vy: (Math.random() - 0.5) * 1.8,
              radius: Math.random() * 2.2 + 1.5,
              alpha: 0.95,
              decay: 0.018 + Math.random() * 0.015,
              color: getRandomColor(1),
            });
          }
        }
        mouseState.current.lastSpawnX = x;
        mouseState.current.lastSpawnY = y;
      }
    };

    const handleMouseLeave = () => {
      mouseState.current.isIdle = true;
    };

    // Click handler for ripples
    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (clickRipples.length < 5) {
        clickRipples.push({
          x,
          y,
          radius: 3,
          maxRadius: 78,
          alpha: 0.7,
          speed: 2.2,
          color: getRandomColor(0.8),
        });
      }

      // Add a burst of splash particles on click
      for (let k = 0; k < 12; k++) {
        if (splashParticles.length < 120) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.6 + Math.random() * 2.4;
          splashParticles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 2.5 + 1.5,
            alpha: 1.0,
            decay: 0.02 + Math.random() * 0.02,
            color: getRandomColor(1),
          });
        }
      }
    };

    // Hook listeners up to standard window/document elements so they capture correctly
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Ambient Background Particles
      ambientParticles.forEach((p) => {
        // Update positions
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundaries
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.fill();
      });
      ctx.shadowBlur = 0; // Reset shadow for other drawings

      // 2. Smooth Glowing Cursor Follower (radial gradient halo)
      const mouse = mouseState.current;
      if (mouse.x > -500) {
        // Interpolate follower toward target
        mouse.x += (mouse.targetX - mouse.x) * 0.09;
        mouse.y += (mouse.targetY - mouse.y) * 0.09;

        // Draw glowing follower outer aura
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          58
        );
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.18)"); // Violet/Indigo glow center
        gradient.addColorStop(0.4, "rgba(6, 182, 212, 0.06)"); // Cyan fade
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Fully transparent outer edge

        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 58, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw cursor inner ring
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(6, 182, 212, 0.35)"; // Cyan ring
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }

      // 3. Draw and Update Splash Particles
      splashParticles = splashParticles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        
        // Dynamic styling for particles
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();

        return true;
      });

      // 4. Draw and Update Click Ripples
      clickRipples = clickRipples.filter((r) => {
        r.radius += r.speed;
        r.alpha = Math.max(0, 1 - r.radius / r.maxRadius) * 0.7;

        if (r.radius >= r.maxRadius) return false;

        ctx.save();
        ctx.globalAlpha = r.alpha;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        return true;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanups on unmount
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      if (mouseState.current.idleTimer) {
        clearTimeout(mouseState.current.idleTimer);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

export default InteractiveAuthBg;
