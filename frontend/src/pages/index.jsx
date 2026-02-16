import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "./user/Header";
import Footer from "./user/Footer";
import { 
  FaDumbbell, 
  FaMapMarkerAlt, 
  FaHeart, 
  FaChartLine, 
  FaArrowRight, 
  FaStar,
  FaCheckCircle,
  FaQuoteLeft,
  FaBolt,
  FaUsers,
  FaTrophy,
  FaRocket,
  FaShieldAlt,
  FaClock,
  FaMobileAlt,
  FaLightbulb,
  FaHandHoldingHeart,
  FaAward,
  FaFire,
  FaCamera,
  FaMoneyBillWave,
  FaHeadset,
  FaChevronRight,
  FaPlay
} from "react-icons/fa";
import { BiTargetLock } from "react-icons/bi";
import { IoMdNutrition } from "react-icons/io";
import { MdVerified, MdTrendingUp } from "react-icons/md";
import "../index.css";

export default function Landing() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Is ExerSearch really free to use?",
      answer: "Yes, absolutely! Finding gyms, getting personalized workout plans, tracking your progress, and accessing nutrition guidance is completely free. We partner with gyms who pay us, so you never have to."
    },
    {
      question: "How do the personalized workout plans work?",
      answer: "Our AI analyzes your fitness goals, current fitness level, available equipment, and time constraints to create custom workout routines. The plans automatically adjust as you progress."
    },
    {
      question: "Can I visit multiple gyms before deciding?",
      answer: "Absolutely! Browse all 50+ partner gyms, compare their amenities, pricing, and reviews. Many gyms offer day passes or trial periods."
    },
    {
      question: "Do I need previous gym experience?",
      answer: "Not at all! We cater to all fitness levels from complete beginners to advanced athletes. Our beginner-friendly plans include detailed instructions and form videos."
    },
    {
      question: "How accurate are the gym reviews?",
      answer: "All reviews come from verified ExerSearch users who have actually visited the gyms. We verify membership receipts and employ anti-fraud measures."
    },
    {
      question: "What makes ExerSearch different?",
      answer: "Unlike simple directories, we provide end-to-end fitness solutions: gym discovery, personalized training plans, nutrition tracking, and progress analytics all in one platform."
    }
  ];

  return (
    <div className="landing-page-v2">
      <Header />

      {/* Hero - Full Screen Split */}
      <section className="split-hero">
        <div className="split-hero-left">
          <div className="hero-content-new">
            <div className="hero-eyebrow">
              <FaBolt className="bolt-icon" />
              <span>START YOUR FITNESS JOURNEY</span>
            </div>
            
            <h1 className="hero-heading">
              Find Your Gym.<br />
              Build Your Body.<br />
              <span className="highlight-text">Track Your Progress.</span>
            </h1>
            
            <p className="hero-lead">
              Discover 50+ gyms in Pasig, get AI-powered workout plans, and achieve 
              real results with ExerSearch.
            </p>

            <div className="hero-cta-group">
              <Link to="/onboarding" className="cta-primary">
                Get Started Free
                <FaArrowRight />
              </Link>
              <Link to="/login" className="cta-outline">
                Sign In
              </Link>
            </div>

            <div className="trust-indicators">
              <div className="trust-item">
                <FaUsers />
                <span>1000+ Active Users</span>
              </div>
              <div className="trust-item">
                <FaTrophy />
                <span>5000+ Workouts</span>
              </div>
              <div className="trust-item">
                <FaStar />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>

        <div className="split-hero-right">
          <div className="hero-image-stack">
            <img 
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=700&fit=crop" 
              alt="Gym" 
              className="stack-img img-1"
            />
            <img 
              src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=700&fit=crop" 
              alt="Equipment" 
              className="stack-img img-2"
            />
            <div className="floating-stat stat-1">
              <h3>50+</h3>
              <p>Partner Gyms</p>
            </div>
            <div className="floating-stat stat-2">
              <h3>100%</h3>
              <p>Free Forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento Grid Layout */}
      <section className="features-bento">
        <div className="container-wide">
          <div className="section-intro">
            <h2 className="section-heading-new">Everything You Need</h2>
            <p className="section-subheading-new">All-in-one fitness platform</p>
          </div>

          <div className="bento-grid">
            <div className="bento-item bento-large">
              <FaMapMarkerAlt className="bento-icon" />
              <h3>Find Your Perfect Gym</h3>
              <p>Browse 50+ verified gyms with detailed info, real photos, pricing, and authentic member reviews</p>
              <div className="bento-badge">Most Popular</div>
            </div>

            <div className="bento-item bento-tall">
              <BiTargetLock className="bento-icon" />
              <h3>Custom Workouts</h3>
              <p>AI-generated routines tailored to your goals</p>
            </div>

            <div className="bento-item">
              <IoMdNutrition className="bento-icon" />
              <h3>Nutrition</h3>
              <p>Smart meal tracking</p>
            </div>

            <div className="bento-item">
              <FaChartLine className="bento-icon" />
              <h3>Analytics</h3>
              <p>Track your progress</p>
            </div>

            <div className="bento-item bento-wide">
              <div className="bento-stats">
                <div className="bento-stat">
                  <h4>50+</h4>
                  <p>Verified Gyms</p>
                </div>
                <div className="bento-stat">
                  <h4>1000+</h4>
                  <p>Active Users</p>
                </div>
                <div className="bento-stat">
                  <h4>5000+</h4>
                  <p>Workouts Done</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props - Zigzag Layout */}
      <section className="value-zigzag">
        <div className="container-new">
          <div className="section-intro">
            <h2 className="section-heading-new">Why Choose ExerSearch</h2>
            <p className="section-subheading-new">Built for real results</p>
          </div>

          <div className="zigzag-container">
            <div className="zigzag-row">
              <div className="zigzag-content">
                <FaShieldAlt className="zigzag-icon" />
                <h3>100% Verified Gyms</h3>
                <p>Every gym partner is thoroughly vetted with real reviews from actual members. No fake ratings, no paid promotions.</p>
              </div>
              <div className="zigzag-visual">
                <div className="visual-box box-1"></div>
              </div>
            </div>

            <div className="zigzag-row reverse">
              <div className="zigzag-content">
                <FaRocket className="zigzag-icon" />
                <h3>AI-Powered Matching</h3>
                <p>Smart algorithms analyze your location, budget, goals, and preferences to find your perfect gym in seconds.</p>
              </div>
              <div className="zigzag-visual">
                <div className="visual-box box-2"></div>
              </div>
            </div>

            <div className="zigzag-row">
              <div className="zigzag-content">
                <FaMoneyBillWave className="zigzag-icon" />
                <h3>All Price Ranges</h3>
                <p>From budget-friendly 50 peso gyms to premium facilities - we help you find options that match your financial comfort.</p>
              </div>
              <div className="zigzag-visual">
                <div className="visual-box box-3"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Stepped Cards */}
      <section className="how-stepped" id="how-it-works">
        <div className="container-new">
          <div className="section-intro">
            <h2 className="section-heading-new">How It Works</h2>
            <p className="section-subheading-new">Three simple steps to success</p>
          </div>

          <div className="stepped-container">
            <div className="step-card step-1">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Tell Us Your Goals</h3>
                <p>Quick 2-minute questionnaire about your fitness objectives, budget, and preferences</p>
                <div className="step-arrow">
                  <FaChevronRight />
                </div>
              </div>
            </div>

            <div className="step-card step-2">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Get Matched & Plan</h3>
                <p>Receive personalized gym recommendations and custom workout routines</p>
                <div className="step-arrow">
                  <FaChevronRight />
                </div>
              </div>
            </div>

            <div className="step-card step-3">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Train & Track</h3>
                <p>Start training and monitor progress with our analytics dashboard</p>
              </div>
            </div>
          </div>

          <div className="centered-cta">
            <Link to="/onboarding" className="cta-primary">
              Start Your Journey
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials - Staggered Cards */}
      <section className="testimonials-staggered" id="reviews">
        <div className="container-new">
          <div className="section-intro">
            <h2 className="section-heading-new">Real People, Real Results</h2>
            <p className="section-subheading-new">Success stories from our community</p>
          </div>

          <div className="staggered-container">
            <div className="testimonial-stagger testimonial-left">
              <FaQuoteLeft className="quote-icon" />
              <p>"Lost 15kg in 3 months! ExerSearch matched me with the perfect gym near my office. The personalized plan kept me motivated every single day."</p>
              <div className="testimonial-author-new">
                <div className="author-img">JD</div>
                <div>
                  <h4>Juan Dela Cruz</h4>
                  <div className="author-stars">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-stagger testimonial-center">
              <FaQuoteLeft className="quote-icon" />
              <p>"As a busy professional, finding a gym that fits my schedule was impossible. ExerSearch made it easy and the nutrition tracking is amazing."</p>
              <div className="testimonial-author-new">
                <div className="author-img">MS</div>
                <div>
                  <h4>Maria Santos</h4>
                  <div className="author-stars">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-stagger testimonial-right">
              <FaQuoteLeft className="quote-icon" />
              <p>"Started as a complete beginner. Now training 5 days a week! The progress tracking keeps me motivated to push harder."</p>
              <div className="testimonial-author-new">
                <div className="author-img">CR</div>
                <div>
                  <h4>Carlo Reyes</h4>
                  <div className="author-stars">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats - Diagonal Split */}
      <section className="stats-diagonal">
        <div className="diagonal-bg"></div>
        <div className="container-new">
          <div className="diagonal-content">
            <div className="diagonal-stat">
              <FaFire className="diagonal-icon" />
              <h3>50+</h3>
              <p>Partner Gyms</p>
            </div>
            <div className="diagonal-stat">
              <FaUsers className="diagonal-icon" />
              <h3>1,000+</h3>
              <p>Active Members</p>
            </div>
            <div className="diagonal-stat">
              <FaTrophy className="diagonal-icon" />
              <h3>5,000+</h3>
              <p>Workouts Done</p>
            </div>
            <div className="diagonal-stat">
              <FaStar className="diagonal-icon" />
              <h3>4.9/5</h3>
              <p>User Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* About - Full Width Image Background with Overlay */}
      <section className="about-overlay" id="about-us">
        <div className="about-bg-image"></div>
        <div className="about-overlay-dark"></div>
        <div className="container-new">
          <div className="about-overlay-content">
            <h2>Your Complete Fitness Partner</h2>
            <p className="about-lead">
              We're revolutionizing how people find gyms and achieve fitness goals in Pasig City. 
              No more guesswork. No more wasted memberships.
            </p>
            <div className="about-features-list">
              <div className="about-feature-item">
                <FaCheckCircle />
                <span>100% Free Forever</span>
              </div>
              <div className="about-feature-item">
                <FaCheckCircle />
                <span>AI-Powered Matching</span>
              </div>
              <div className="about-feature-item">
                <FaCheckCircle />
                <span>Verified Reviews</span>
              </div>
              <div className="about-feature-item">
                <FaCheckCircle />
                <span>Expert Plans</span>
              </div>
              <div className="about-feature-item">
                <FaCheckCircle />
                <span>Progress Tracking</span>
              </div>
              <div className="about-feature-item">
                <FaCheckCircle />
                <span>Community Support</span>
              </div>
            </div>
            <Link to="/onboarding" className="cta-white">
              Join Now
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features - Horizontal Scroll Carousel */}
      <section className="platform-carousel">
        <div className="container-new">
          <div className="section-intro">
            <h2 className="section-heading-new">Platform Features</h2>
            <p className="section-subheading-new">Everything in one place</p>
          </div>

          <div className="carousel-scroll">
            <div className="carousel-card">
              <FaCamera className="carousel-icon" />
              <h3>Photo Galleries</h3>
              <p>View real gym photos before visiting</p>
            </div>
            <div className="carousel-card">
              <FaMapMarkerAlt className="carousel-icon" />
              <h3>Location Maps</h3>
              <p>Find gyms with directions</p>
            </div>
            <div className="carousel-card">
              <BiTargetLock className="carousel-icon" />
              <h3>Goal Tracking</h3>
              <p>Monitor your milestones</p>
            </div>
            <div className="carousel-card">
              <IoMdNutrition className="carousel-icon" />
              <h3>Meal Planning</h3>
              <p>Budget nutrition guides</p>
            </div>
            <div className="carousel-card">
              <FaChartLine className="carousel-icon" />
              <h3>Progress Charts</h3>
              <p>Visual analytics</p>
            </div>
            <div className="carousel-card">
              <FaHeadset className="carousel-icon" />
              <h3>24/7 Support</h3>
              <p>Always here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs - Smooth Accordion */}
      <section className="faqs-accordion" id="faqs">
        <div className="container-new">
          <div className="section-intro">
            <h2 className="section-heading-new">Frequently Asked Questions</h2>
            <p className="section-subheading-new">Everything you need to know</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item-new ${activeFaq === index ? 'active' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <h3>{faq.question}</h3>
                  <span className="faq-toggle">{activeFaq === index ? '−' : '+'}</span>
                </div>
                <div className={`faq-answer ${activeFaq === index ? 'open' : ''}`}>
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Full Width Gradient */}
      <section className="final-cta-banner">
        <div className="container-new">
          <div className="cta-banner-content">
            <h2>Ready to Transform Your Life?</h2>
            <p>Join 1000+ members who found their perfect gym and achieved their goals</p>
            <Link to="/onboarding" className="cta-large">
              Get Started - It's Free
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}