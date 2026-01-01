import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MdAccountBalance,
  MdTrendingUp,
  MdBarChart,
  MdMap,
  MdCheckCircle
} from 'react-icons/md';
import FAQSection from '../components/FAQSection';
import './Home.css';

const Home: React.FC = () => {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const { t } = useTranslation();

  const banners = [
    '/banners/wide-banner.png',
    '/banners/1.jpg',
    '/banners/2.jpg',
    '/banners/3.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="home-page">

      {/* 1. HERO SECTION */}
      <section className="home-hero-full">
        {/* Background Slider */}
        <div className="hero-background-slider">
          {banners.map((src, index) => (
            <div
              key={index}
              className="hero-slide-bg"
              style={{
                backgroundImage: `url(${src})`,
                opacity: index === currentBannerIndex ? 1 : 0
              }}
            />
          ))}
          <div className="hero-overlay-gradient"></div>
        </div>

        <div className="home-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="hero-content-card">
            <h1>
              PM-AJAY <span className="hero-highlight">Dashboard</span>
            </h1>
            <p className="hero-description">
              Pradhan Mantri Adarsh Gram Yojana:<br />
              Empowering India's villages through data-driven development, transparency, and efficient fund management.
            </p>

            <div className="hero-stats-row">
              <div className="stat-item">
                <h4>1,200+</h4>
                <p>Adarsh Villages</p>
              </div>
              <div className="stat-item">
                <h4>₹500Cr</h4>
                <p>Funds Utilized</p>
              </div>
              <div className="stat-item">
                <h4>8,500</h4>
                <p>Projects Verified</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE BELOW HERO */}
      <div className="marquee-container" style={{ marginBottom: 0, background: '#1a237e' }}>
        <div className="marquee-content">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="marquee-item">
              📢 Latest News: <strong>PM-AJAY Scheme Applications open for 2025!</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              📞 Toll Free: <strong>+1 660-324-5710</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;
              🗓️ Next Village Camp: <strong>Dec 15th, 2024</strong>
              &nbsp;&nbsp;|&nbsp;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* 2. ABOUT SECTION */}
      <section className="home-about">
        <div className="home-container">
          <div className="about-content">
            <h2>Vision for a Better Tomorrow</h2>
            <p>
              Gram Pragati Setu facilitates the seamless implementation of the PM-AJAY scheme.
              By connecting District Officers, Volunteers, and Villagers on a single unified platform,
              we ensure that every rupee allocated translates into tangible development—be it roads,
              schools, or healthcare centers.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CORE FEATURES */}
      <section className="home-features">
        <div className="home-container">
          <div className="section-header">
            <h2>Key Pillars of Progress</h2>
            <p>Leveraging technology to bridge the gap between policy and execution.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box">
                <MdAccountBalance />
              </div>
              <h3>Transparent Funding</h3>
              <p>Real-time tracking of fund allocation and utilization across all administrative levels.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <MdTrendingUp />
              </div>
              <h3>Progress Monitoring</h3>
              <p>Live status updates on project completion with geo-tagged photographic evidence.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <MdBarChart />
              </div>
              <h3>Data Analytics</h3>
              <p>Comprehensive dashboards for officers to identify gaps and prioritize needs.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <MdMap />
              </div>
              <h3>Village Mapping</h3>
              <p>GIS-integrated mapping for visual representation of development across districts.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <MdCheckCircle />
              </div>
              <h3>Public Audit</h3>
              <p>Empowering citizens to view and audit the progress of works in their villages.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <FAQSection />

      {/* 5. FOOTER & CONTACT MARQUEE */}
      <footer className="home-footer">
        <div className="marquee-container">
          <div className="marquee-content">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="marquee-item">
                📞 Toll Free:
                <strong
                  className="clickable-contact"
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard.writeText('+1 660-324-5710');
                    alert('Copied: +1 660-324-5710');
                  }}
                >+1 660-324-5710</strong>,
                <strong
                  className="clickable-contact"
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard.writeText('+1 660-324-5714');
                    alert('Copied: +1 660-324-5714');
                  }}
                >+1 660-324-5714</strong>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                ✉️ Email:
                <strong
                  className="clickable-contact"
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard.writeText('gramsetu@gov.in');
                    alert('Copied: gramsetu@gov.in');
                  }}
                >gramsetu@gov.in</strong>
                &nbsp;&nbsp;|&nbsp;&nbsp;
              </span>
            ))}
          </div>
        </div>

        <div className="footer-links-container">
          <div className="home-container">
            <div className="footer-grid">
              <div className="footer-col">
                <h4>Gram Pragati Setu</h4>
                <p>Empowering rural India through digital governance and transparency.</p>
              </div>
              <div className="footer-col">
                <h4>Quick Links</h4>
                <ul>
                  <li><a href="#">About Scheme</a></li>
                  <li><a href="#">Guidelines</a></li>
                  <li><a href="#">Dashboard</a></li>
                  <li><a href="#">Contact Us</a></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4>Contact Officer</h4>
                <p>Ministry of Social Justice & Empowerment</p>
                <p>Government of India</p>
              </div>
            </div>
            <div className="footer-bottom">
              <p>© 2024 Gram Pragati Setu. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
