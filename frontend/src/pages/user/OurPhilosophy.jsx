import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./philosopy.scss";

const panels = [
  {
    front: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    back: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    left: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    right: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    front: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?auto=format&fit=crop&w=1200&q=80",
    back: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
    left: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    right: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80",
  },
  {
    front: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=80",
    back: "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=1200&q=80",
    left: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    right: "https://images.unsplash.com/photo-1534367507873-d2d7e24c797f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    front: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=80",
    back: "https://images.unsplash.com/photo-1518611012118-fb328b0b8d0c?auto=format&fit=crop&w=1200&q=80",
    left: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    right: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=80",
  },
  {
    front: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    back: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    left: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
    right: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function HeroFivePanels() {
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const hoverTlRef = useRef(null);
  const tappedRef = useRef(false);

  useEffect(() => {
    const stage = stageRef.current;
    const hero = heroRef.current;
    if (!stage || !hero) return;

    const ctx = gsap.context(() => {
      gsap.set(stage, { autoAlpha: 1 });
      gsap.set(".hero__inner", { z: -140 });

      const intro = gsap.timeline();

      intro
        .from(".hero__cuboid", {
          rotateY: 270,
          x: "100vw",
          rotationZ: 90,
          duration: 2.4,
          stagger: 0.12,
          ease: "power4.out",
          transformOrigin: "center center",
        })
        .from(
          ".hero",
          {
            scale: 1.4,
            duration: 2.8,
            ease: "power3.out",
          },
          0
        )
        .from(
          ".face--front img",
          {
            scale: 1.2,
            duration: 3,
            ease: "power3.out",
            stagger: 0.05,
          },
          0.2
        )
        .to(
          ".face--right img, .face--back img, .face--left img",
          {
            opacity: 0,
            duration: 1.2,
            stagger: 0.06,
            ease: "power2.out",
          },
          0.4
        );

      const hoverTl = gsap.timeline({
        paused: true,
        defaults: { duration: 0.9, ease: "power3.inOut" },
      });

      hoverTl
        .to(".hero__cuboid--1", { x: "-80%", rotationY: -90 }, 0)
        .to(".hero__cuboid--2", { x: "-40%", rotationY: -90 }, 0)
        .to(".hero__cuboid--3", { x: "0%", rotationY: 0 }, 0)
        .to(".hero__cuboid--4", { x: "40%", rotationY: 90 }, 0)
        .to(".hero__cuboid--5", { x: "80%", rotationY: 90 }, 0)

        .to(".hero__cuboid--1 .face--front img", { opacity: 0 }, 0)
        .to(".hero__cuboid--2 .face--front img", { opacity: 0 }, 0)
        .to(".hero__cuboid--4 .face--front img", { opacity: 0 }, 0)
        .to(".hero__cuboid--5 .face--front img", { opacity: 0 }, 0)

        .fromTo(
          ".hero__cuboid--1 .face--right img",
          { opacity: 0 },
          { opacity: 1 },
          0.08
        )
        .fromTo(
          ".hero__cuboid--2 .face--right img",
          { opacity: 0 },
          { opacity: 1 },
          0.1
        )
        .fromTo(
          ".hero__cuboid--4 .face--left img",
          { opacity: 0 },
          { opacity: 1 },
          0.1
        )
        .fromTo(
          ".hero__cuboid--5 .face--left img",
          { opacity: 0 },
          { opacity: 1 },
          0.08
        );

      hoverTlRef.current = hoverTl;

      const onEnter = () => hoverTl.play();
      const onLeave = () => hoverTl.reverse();
      const onTouch = () => {
        if (!tappedRef.current) {
          tappedRef.current = true;
          hoverTl.play();
        } else {
          tappedRef.current = false;
          hoverTl.reverse();
        }
      };

      hero.addEventListener("mouseenter", onEnter);
      hero.addEventListener("mouseleave", onLeave);
      hero.addEventListener("touchstart", onTouch, { passive: true });

      return () => {
        hero.removeEventListener("mouseenter", onEnter);
        hero.removeEventListener("mouseleave", onLeave);
        hero.removeEventListener("touchstart", onTouch);
      };
    }, stage);

    return () => ctx.revert();
  }, []);

  return (
    <section className="fiveHero" ref={stageRef}>
      <div className="fiveHero__hero" ref={heroRef}>
        <div className="hero__inner">
          {panels.map((panel, index) => (
            <div
              className={`hero__cuboid hero__cuboid--${index + 1}`}
              key={index}
            >
              <div className="face face--front">
                <img src={panel.front} alt="" />
              </div>
              <div className="face face--back">
                <img src={panel.back} alt="" />
              </div>
              <div className="face face--left">
                <img src={panel.left} alt="" />
              </div>
              <div className="face face--right">
                <img src={panel.right} alt="" />
              </div>
              <div className="face face--top" />
              <div className="face face--bottom" />
            </div>
          ))}
        </div>

        <div className="fiveHero__overlay" />

        <div className="fiveHero__content">
          <p className="fiveHero__eyebrow">Our Philosophy</p>
          <h1>Fitness should feel clear, guided, and sustainable.</h1>
        </div>
      </div>
    </section>
  );
}