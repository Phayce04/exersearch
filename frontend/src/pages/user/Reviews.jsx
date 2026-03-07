import React, { useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  MapPinned,
  Dumbbell,
} from "lucide-react";
import "./Reviews.css";

gsap.registerPlugin(ScrollTrigger);

export default function ReviewsPage() {
  const sectionRef = useRef(null);
  const logoPathRef = useRef(null);

  useEffect(() => {
    let heightRatio = window.innerWidth / window.innerHeight;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        [".reviews-hero-bg-svg", ".reviews-hero-content"],
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25 }
      )
        .fromTo(
          logoPathRef.current,
          {
            scaleX: 0.16,
            scaleY: () => 0.22 * heightRatio,
            x: 0,
            transformOrigin: "center center",
          },
          {
            scaleX: 18.2,
            scaleY: () => 14.6 * heightRatio,
            x: -0.22,
            transformOrigin: "center center",
            duration: 1,
            ease: "power2.in",
          }
        )
        .to({}, { duration: 0.25 });

      gsap.fromTo(
        ".reviews-feedback-card",
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".reviews-feedback-grid",
            start: "top 80%",
          },
        }
      );

      gsap.fromTo(
        ".reviews-highlights-card",
        { y: 40, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".reviews-highlights-grid",
            start: "top 82%",
          },
        }
      );

      gsap.fromTo(
        ".reviews-invite-inner",
        { y: 50, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".reviews-invite",
            start: "top 78%",
          },
        }
      );
    });

    const handleResize = () => {
      heightRatio = window.innerWidth / window.innerHeight;
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx.revert();
    };
  }, []);

  return (
    <>
      <Header />

      <div className="reviews-page">
        <section className="reviews-hero-section" ref={sectionRef}>
          <div className="reviews-hero-container">
            <svg
              className="reviews-hero-bg-svg"
              viewBox="0 0 1200 900"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient
                  id="reviewsSwirlGradient"
                  cx="50%"
                  cy="50%"
                  r="80%"
                >
                  <stop offset="0%" stopColor="#ff8c00" />
                  <stop offset="60%" stopColor="#ff5f1f" />
                  <stop offset="100%" stopColor="#8b1e0f" />
                </radialGradient>

                <filter id="reviewsSwirl" x="0" y="0">
                  <feTurbulence
                    type="turbulence"
                    baseFrequency="0.012 0.018"
                    numOctaves="2"
                    seed="8"
                    result="turb"
                  />
                  <feDisplacementMap
                    in2="turb"
                    in="SourceGraphic"
                    scale="120"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>
              </defs>

              <circle
                cx="600"
                cy="450"
                r="800"
                fill="url(#reviewsSwirlGradient)"
                filter="url(#reviewsSwirl)"
              />
            </svg>

            <div className="reviews-hero-content">
              <p className="reviews-hero-kicker">What people say</p>
              <h1>REVIEWS</h1>
              <p>
                Early impressions from users exploring gyms, amenities, and
                fitness options with Exersearch.
              </p>
            </div>
          </div>
        </section>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="0"
          height="0"
          className="reviews-clip-container"
        >
          <clipPath id="reviews-clip-path" clipPathUnits="objectBoundingBox">
            <path
              ref={logoPathRef}
              d="M0.028212 0.199409L0.000000 0.033593L0.105609 0.033593L0.080112 0.199409L0.080112 0.497447Q0.080112 0.591776 0.082291 0.657081Q0.084430 0.722386 0.088748 0.763504Q0.093066 0.804354 0.099605 0.822360Q0.106144 0.840365 0.114863 0.840365Q0.120168 0.840365 0.124815 0.834991Q0.129421 0.829347 0.133287 0.814835Q0.137152 0.800591 0.140114 0.775598Q0.143075 0.750605 0.145131 0.712443Q0.147187 0.674550 0.148297 0.621338Q0.149408 0.568127 0.149408 0.497447L0.149408 0.200215L0.127529 0.033593L0.203529 0.033593L0.177825 0.200215L0.177825 0.536684Q0.177825 0.629132 0.175522 0.699812Q0.173178 0.770223 0.168860 0.821822Q0.164542 0.873421 0.158332 0.907283Q0.152122 0.941414 0.144267 0.962107Q0.136453 0.982800 0.127200 0.991400Q0.117988 1.000000 0.107542 1.000000Q0.085664 1.000000 0.070489 0.970975Q0.055313 0.942220 0.045937 0.884171Q0.036560 0.826122 0.032366 0.739049Q0.028212 0.652244 0.028212 0.536684L0.028212 0.199409ZM0.220801 0.653588Q0.230507 0.695512 0.241281 0.731792Q0.252015 0.768342 0.263489 0.795216Q0.275004 0.822091 0.287095 0.837409Q0.299186 0.852996 0.311770 0.852996Q0.316582 0.852996 0.321023 0.848965Q0.325506 0.845203 0.328878 0.836334Q0.332250 0.827466 0.334307 0.812685Q0.336363 0.797904 0.336363 0.776942Q0.336363 0.757861 0.334636 0.738511Q0.332949 0.719161 0.328056 0.701424Q0.323203 0.683687 0.314443 0.668369Q0.305725 0.652781 0.291783 0.640957Q0.273112 0.625369 0.259335 0.600376Q0.245600 0.575383 0.236552 0.536684Q0.227505 0.497984 0.223104 0.443429Q0.218663 0.389143 0.218663 0.314163Q0.218663 0.242677 0.223639 0.185972Q0.228615 0.129266 0.237950 0.089761Q0.247286 0.050524 0.260651 0.029562Q0.274017 0.008600 0.290755 0.008600Q0.297705 0.008600 0.304738 0.013437Q0.311770 0.018275 0.318597 0.026874Q0.325424 0.035474 0.331921 0.047030Q0.338460 0.058318 0.344177 0.070949L0.363876 0.000000L0.377611 0.000000L0.377611 0.314969Q0.366878 0.273582 0.355980 0.242139Q0.345081 0.210696 0.334389 0.189196Q0.323696 0.167966 0.313497 0.157216Q0.303298 0.146197 0.294086 0.146197Q0.288041 0.146197 0.283188 0.152110Q0.278335 0.158022 0.274963 0.167966Q0.271591 0.177909 0.269781 0.191346Q0.267972 0.204784 0.267972 0.219833Q0.267972 0.241333 0.269781 0.258801Q0.271591 0.276270 0.276814 0.291320Q0.282037 0.306369 0.291454 0.320613Q0.300913 0.334587 0.316170 0.350981Q0.326328 0.362268 0.335540 0.374630Q0.344794 0.386993 0.352731 0.404461Q0.360668 0.421930 0.367042 0.446117Q0.373417 0.470572 0.377899 0.504434Q0.382423 0.538565 0.384891 0.584520Q0.387358 0.630476 0.387358 0.691481Q0.387358 0.772910 0.381313 0.831228Q0.375308 0.889814 0.365068 0.927170Q0.354828 0.964526 0.341216 0.982263Q0.327603 1.000000 0.312551 1.000000Q0.298487 1.000000 0.284134 0.980650Q0.269781 0.961301 0.256621 0.918033L0.240582 0.983606L0.220801 0.983606L0.220801 0.653588ZM0.428936 0.807579L0.428936 0.200215L0.400724 0.033593L0.583155 0.033593L0.581140 0.358774L0.541084 0.183822L0.481823 0.183822L0.481823 0.400967L0.542277 0.400967L0.542277 0.545283L0.481823 0.545283L0.481823 0.823972L0.541084 0.823972L0.582127 0.664069L0.582127 0.974469L0.400724 0.974469L0.428936 0.807579ZM0.629914 0.807579L0.629914 0.200215L0.598824 0.033593Q0.608241 0.032787 0.618399 0.032249Q0.628516 0.031443 0.638551 0.031174Q0.648585 0.030906 0.658126 0.030099Q0.667667 0.029562 0.676057 0.029293Q0.684446 0.028756 0.691273 0.028756Q0.698100 0.028756 0.702624 0.028756Q0.712165 0.028756 0.722611 0.031443Q0.733056 0.034131 0.743132 0.042999Q0.753208 0.051868 0.762296 0.069336Q0.771385 0.086536 0.778294 0.115829Q0.785162 0.145122 0.789233 0.187853Q0.793305 0.230852 0.793305 0.291320Q0.793305 0.337275 0.790796 0.374093Q0.788246 0.410642 0.783599 0.439667Q0.778911 0.468422 0.772290 0.490191Q0.765669 0.511690 0.757526 0.527546Q0.763859 0.533459 0.769452 0.555496Q0.775004 0.577264 0.779117 0.610857Q0.783229 0.644182 0.785614 0.688256Q0.787959 0.732330 0.787959 0.782854L0.787959 0.820747L0.816170 0.974469L0.717388 0.974469L0.732645 0.834453L0.732645 0.753830Q0.732645 0.719699 0.731124 0.691212Q0.729643 0.662725 0.727011 0.642032Q0.724420 0.621338 0.720966 0.609782Q0.717470 0.598495 0.713686 0.598495L0.682843 0.598495L0.682843 0.807579L0.701020 0.974469L0.598700 0.974469L0.629914 0.807579M0.697483 0.469766Q0.708052 0.469766 0.715866 0.463854Q0.723721 0.457941 0.728862 0.441548Q0.734043 0.425154 0.736552 0.396399Q0.739061 0.367374 0.739061 0.322225Q0.739061 0.287288 0.737251 0.262564Q0.735442 0.237571 0.732357 0.220908Q0.729232 0.203977 0.725078 0.193765Q0.720883 0.183822 0.716277 0.178715Q0.711671 0.173878 0.706860 0.172266Q0.702007 0.170653 0.697483 0.170653L0.682843 0.170653L0.682843 0.469766L0.697483 0.469766ZM0.833443 0.653588Q0.843190 0.695512 0.853923 0.731792Q0.864657 0.768342 0.876172 0.795216Q0.887646 0.822091 0.899778 0.837409Q0.911869 0.852996 0.924412 0.852996Q0.929224 0.852996 0.933706 0.848965Q0.938189 0.845203 0.941520 0.836334Q0.944892 0.827466 0.946948 0.812685Q0.949005 0.797904 0.949005 0.776942Q0.949005 0.757861 0.947319 0.738511Q0.945591 0.719161 0.940739 0.701424Q0.935845 0.683687 0.927126 0.668369Q0.918408 0.652781 0.904425 0.640957Q0.885754 0.625369 0.872018 0.600376Q0.858241 0.575383 0.849194 0.536684Q0.840188 0.497984 0.835746 0.443429Q0.831346 0.389143 0.831346 0.314163Q0.831346 0.242677 0.836322 0.185972Q0.841298 0.129266 0.850633 0.089761Q0.859969 0.050524 0.873293 0.029562Q0.886659 0.008600 0.903438 0.008600Q0.910347 0.008600 0.917379 0.013437Q0.924412 0.018275 0.931239 0.026874Q0.938065 0.035474 0.944604 0.047030Q0.951102 0.058318 0.956860 0.070949L0.976518 0.000000L0.990294 0.000000L0.990294 0.314969Q0.979520 0.273582 0.968621 0.242139Q0.957764 0.210696 0.947072 0.189196Q0.936379 0.167966 0.926180 0.157216Q0.915981 0.146197 0.906728 0.146197Q0.900724 0.146197 0.895830 0.152110Q0.890977 0.158022 0.887605 0.167966Q0.884233 0.177909 0.882464 0.191346Q0.880655 0.204784 0.880655 0.219833Q0.880655 0.241333 0.882464 0.258801Q0.884233 0.276270 0.889455 0.291320Q0.894678 0.306369 0.904137 0.320613Q0.913555 0.334587 0.928812 0.350981Q0.938970 0.362268 0.948223 0.374630Q0.957435 0.386993 0.965373 0.404461Q0.973310 0.421930 0.979684 0.446117Q0.986059 0.470572 0.990582 0.504434Q0.995106 0.538565 0.997574 0.584520Q1.000000 0.630476 1.000000 0.691481Q1.000000 0.772910 0.993996 0.831228Q0.987950 0.889814 0.977710 0.927170Q0.967470 0.964526 0.953899 0.982263Q0.940286 1.000000 0.925234 1.000000Q0.911170 1.000000 0.896817 0.980650Q0.882464 0.961301 0.869304 0.918033L0.853224 0.983606L0.833443 0.983606L0.833443 0.653588Z"
            />
          </clipPath>
        </svg>

        <section className="reviews-feedback">
          <div className="reviews-wrap">
            <div className="reviews-section-head">
              <p className="reviews-section-eyebrow">
                <MessageSquareQuote size={14} />
                Early Feedback
              </p>
              <h2 className="reviews-section-title">
                Early Feedback from <span>Our First Users</span>
              </h2>
              <p className="reviews-section-sub">
                We are just getting started, but a few early users have already
                shared simple thoughts about their experience browsing gyms on
                Exersearch.
              </p>
            </div>

            <div className="reviews-feedback-grid">
              <article className="reviews-feedback-card">
                <p className="reviews-feedback-quote">
                  “The map makes it much easier to compare gyms around me.”
                </p>
                <span className="reviews-feedback-author">— Early tester</span>
              </article>

              <article className="reviews-feedback-card">
                <p className="reviews-feedback-quote">
                  “I like being able to see amenities before visiting.”
                </p>
                <span className="reviews-feedback-author">— Beta user</span>
              </article>

              <article className="reviews-feedback-card">
                <p className="reviews-feedback-quote">
                  “It feels simpler to narrow down options without opening lots
                  of separate pages.”
                </p>
                <span className="reviews-feedback-author">— First-wave user</span>
              </article>
            </div>
          </div>
        </section>

        <section className="reviews-highlights">
          <div className="reviews-wrap">
            <div className="reviews-section-head reviews-section-head--center">
              <p className="reviews-section-eyebrow reviews-section-eyebrow--dark">
                <Star size={14} />
                What Reviews Will Show
              </p>
              <h2 className="reviews-section-title reviews-section-title--dark">
                What Makes a <span>Great Gym Review</span>
              </h2>
              <p className="reviews-section-sub reviews-section-sub--dark">
                As more members start sharing their experiences, reviews on
                Exersearch will help people decide faster and with more
                confidence.
              </p>
            </div>

            <div className="reviews-highlights-grid">
              <article className="reviews-highlights-card">
                <div className="reviews-highlights-icon">
                  <ShieldCheck size={20} />
                </div>
                <div className="reviews-highlights-copy">
                  <h3>Trusted Feedback</h3>
                  <p>
                    Real experiences from real gym-goers so users can compare
                    options with more confidence.
                  </p>
                </div>
              </article>

              <article className="reviews-highlights-card">
                <div className="reviews-highlights-icon">
                  <Dumbbell size={20} />
                </div>
                <div className="reviews-highlights-copy">
                  <h3>Equipment & Space</h3>
                  <p>
                    Reviews can highlight gym cleanliness, crowd levels,
                    equipment quality, and overall workout environment.
                  </p>
                </div>
              </article>

              <article className="reviews-highlights-card">
                <div className="reviews-highlights-icon">
                  <MapPinned size={20} />
                </div>
                <div className="reviews-highlights-copy">
                  <h3>Local Insight</h3>
                  <p>
                    Members can share what a gym really feels like before
                    someone visits for the first time.
                  </p>
                </div>
              </article>

              <article className="reviews-highlights-card">
                <div className="reviews-highlights-icon">
                  <MessageSquareQuote size={20} />
                </div>
                <div className="reviews-highlights-copy">
                  <h3>Helpful Details</h3>
                  <p>
                    From staff friendliness to peak-hour experience, small
                    details can make choosing the right gym easier.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="reviews-invite">
          <div className="reviews-wrap">
            <div className="reviews-invite-inner">
              <div className="reviews-invite-copy">
                <p className="reviews-section-eyebrow">
                  <Sparkles size={14} />
                  Be One of the First
                </p>

                <h2 className="reviews-section-title">
                  Be One of the First to <em>Review Gyms</em>
                </h2>

                <p className="reviews-section-sub reviews-section-sub--tight">
                  Exersearch is just getting started. As our community grows,
                  real member reviews will appear here — covering gym
                  cleanliness, equipment quality, staff friendliness, and the
                  overall experience.
                </p>
              </div>

              <div className="reviews-invite-actions">
                <a href="/login" className="reviews-invite-btn">
                  <span>Explore Gyms Near You</span>
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}