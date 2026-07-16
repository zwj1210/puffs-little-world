"use client";

import { useEffect, useRef, useState } from "react";

const BG_IMAGE = "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260713_140344_79e1296a-86d7-43fd-9b5f-63ffe560f291.png&w=1280&q=85";
const FRONT_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_162101_0d7498c5-29bb-47bf-a99f-2773c0a880a9.mp4";
const OVERLAY_IMAGE = "https://soft-zoom-63098134.figma.site/_assets/v11/3f10f1876e118f72a396e05a6c2d099569478272.png";
const NAV_ITEMS = ["ToDo List", "日常手账", "随笔小记", "影像留存"];

function Logo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 256 256" className="h-7 w-7" fill="white">
      <path d="M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z" />
    </svg>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const smooth = useRef({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    target.current = { x: rect.width / 2, y: rect.height * 0.72 };
    smooth.current = { ...target.current };

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const onMove = (event: PointerEvent) => {
      const bounds = hero.getBoundingClientRect();
      target.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    };
    hero.addEventListener("pointermove", onMove);

    let frame = 0;
    const draw = () => {
      const bounds = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(bounds.width * dpr));
      const height = Math.max(1, Math.round(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      smooth.current.x += (target.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (target.current.y - smooth.current.y) * 0.1;

      if (ctx && maskRef.current) {
        ctx.clearRect(0, 0, width, height);
        const x = smooth.current.x * dpr;
        const y = smooth.current.y * dpr;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 260 * dpr);
        gradient.addColorStop(0, "rgba(255,255,255,1)");
        gradient.addColorStop(0.4, "rgba(255,255,255,1)");
        gradient.addColorStop(0.6, "rgba(255,255,255,.75)");
        gradient.addColorStop(0.75, "rgba(255,255,255,.4)");
        gradient.addColorStop(0.88, "rgba(255,255,255,.12)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        const url = `url(${canvas.toDataURL("image/png")})`;
        maskRef.current.style.maskImage = url;
        maskRef.current.style.webkitMaskImage = url;
        maskRef.current.style.maskSize = "100% 100%";
        maskRef.current.style.webkitMaskSize = "100% 100%";
      }

      if (gridRef.current) {
        const offsetX = ((smooth.current.x / bounds.width) - 0.5) * 16;
        const offsetY = ((smooth.current.y / bounds.height) - 0.5) * 16;
        gridRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(1.04)`;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); hero.removeEventListener("pointermove", onMove); };
  }, []);

  return (
    <main className="h-screen overflow-hidden bg-white">
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <a href="#" aria-label="PUFF'S LITTLE WORLD home" className="relative z-10"><Logo /></a>
        <nav aria-label="Main navigation" className="liquid-glass absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full p-1.5 sm:flex">
          {NAV_ITEMS.map((item) => <a key={item} href="#" className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white">{item}</a>)}
        </nav>
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="liquid-glass flex h-11 items-center gap-2 rounded-full px-4 sm:hidden">
          <span className="text-[11px] font-medium tracking-[.14em] text-white/90">MENU</span>
          <span className="flex flex-col items-end gap-1.5"><span className="h-[1.5px] w-5 bg-white" /><span className="h-[1.5px] w-3.5 bg-white" /></span>
        </button>
      </header>

      <div className={`fixed inset-0 z-[55] flex flex-col bg-[#0a0a0a] px-6 py-5 transition-[clip-path] duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] sm:px-8 sm:py-7 ${menuOpen ? "clip-open" : "clip-closed pointer-events-none"}`} aria-hidden={!menuOpen}>
        <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className={`liquid-glass ml-auto flex h-11 w-14 items-center justify-center rounded-full transition duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-80 opacity-0"}`}>
          <span className="absolute h-[1.5px] w-5 rotate-45 bg-white" /><span className="absolute h-[1.5px] w-5 -rotate-45 bg-white" />
        </button>
        <nav className="flex flex-1 flex-col items-center justify-center gap-7">
          {NAV_ITEMS.map((item, index) => <a key={item} href="#" onClick={() => setMenuOpen(false)} style={{ transitionDelay: menuOpen ? `${100 + index * 60}ms` : "0ms" }} className={`text-3xl font-medium text-white/90 transition-all duration-700 ease-[cubic-bezier(0.77,0,0.18,1)] sm:text-4xl ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>{item}</a>)}
        </nav>
      </div>

      <section ref={heroRef} className="font-helvetica-neue relative h-screen overflow-hidden bg-[#08090a]">
        <div ref={gridRef} className="absolute -inset-5 z-0 opacity-10 will-change-transform" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cpath d='M 48 0 L 0 0 0 48' fill='none' stroke='%2364748b' stroke-width='.6'/%3E%3C/svg%3E\")" }} />
        <div className="absolute inset-0 z-10 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("${BG_IMAGE}")` }} />
        <h1 className="font-instrument pointer-events-none absolute inset-x-0 top-20 z-20 whitespace-nowrap text-center text-[2.75rem] leading-[.9] uppercase tracking-[-.035em] text-white min-[420px]:text-[3.4rem] sm:top-28 sm:text-[5.2rem] md:top-32 md:text-[6.8rem] lg:text-[8.6rem]">PUFF&apos;S LITTLE WORLD</h1>
        <img src={OVERLAY_IMAGE} alt="" className="pointer-events-none absolute inset-0 z-[25] h-full w-full object-cover" />
        <div ref={maskRef} className="pointer-events-none absolute inset-0 z-30" style={{ clipPath: "inset(40% 0 0 0)" }}>
          <video src={FRONT_VIDEO} className="h-full w-full object-cover" autoPlay loop muted playsInline preload="auto" />
        </div>
      </section>
    </main>
  );
}
