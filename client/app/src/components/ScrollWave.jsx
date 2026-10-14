import { useEffect, useRef } from 'react';

// A quiet, full-viewport background texture shared by every signed-in screen.
export default function ScrollWave({ feature = false }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let width = 0;
    let height = 0;
    let pointerX = -1000;
    let pointerY = -1000;
    let scroll = window.scrollY;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const bounds = feature ? canvas.getBoundingClientRect() : null;
      width = feature ? bounds.width : window.innerWidth;
      height = feature ? bounds.height : window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const move = (event) => { const bounds = feature ? canvas.getBoundingClientRect() : { left:0, top:0 }; pointerX = event.clientX - bounds.left; pointerY = event.clientY - bounds.top; };
    const leave = () => { pointerX = -1000; pointerY = -1000; };
    const onScroll = () => { scroll = window.scrollY; };
    const draw = (time) => {
      context.clearRect(0, 0, width, height);
      const theme = document.documentElement.dataset.theme;
      const dark = theme === 'dark';
      const rows = 31;
      const columns = Math.max(80, Math.floor(width / 9));
      for (let row = 0; row < rows; row += 1) {
        const depth = row / (rows - 1);
        const base = theme === 'tomato' ? (row % 4 === 0 ? [196, 59, 48] : [47, 118, 60]) : dark ? [229, 198, 163] : [128, 0, 32];
        for (let column = 0; column < columns; column += 1) {
          const across = column / (columns - 1);
          const x = across * width;
          const wave = Math.sin(across * 10 + time * .00055 + scroll * .003) * 18 + Math.cos(across * 4.5 - time * .0004) * 11;
          const y = height * (.26 + depth * .7) + wave * (0.28 + depth) + Math.sin(across * 19 + depth * 7 + time * .0008) * 3;
          const distance = Math.hypot(x - pointerX, y - pointerY);
          const influence = Math.max(0, 1 - distance / 145);
          const alpha = .1 + depth * .34 + influence * .2;
          const size = .65 + depth * .75 + influence * .9;
          context.fillStyle = `rgba(${base.join(',')},${alpha})`;
          context.beginPath();
          context.arc(x, y - influence * 18, size, 0, Math.PI * 2);
          context.fill();
        }
      }
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize, { passive:true });
    window.addEventListener('pointermove', move, { passive:true });
    window.addEventListener('pointerleave', leave);
    window.addEventListener('scroll', onScroll, { passive:true });
    if (reducedMotion) draw(0);
    else frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [feature]);
  const canvas = <canvas ref={canvasRef} className={feature ? 'app-wave-background app-wave-feature__canvas' : 'app-wave-background'} aria-hidden="true" />;
  if (!feature) return canvas;
  return <section className="dashboard-wave-feature" aria-label="Interactive animated wave field">
    <div className="dashboard-wave-feature__copy"><span className="eyebrow">A little motion, a little calm</span><h2>Good service has its own rhythm.</h2><p>Move your pointer across the field and watch the wave respond.</p></div>
    {canvas}<span className="dashboard-wave-feature__caption">ASTRAEON · RESTAURANT OPERATIONS</span>
  </section>;
}
