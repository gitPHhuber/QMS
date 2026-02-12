import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Sun, Moon, ShieldCheck, Hexagon, Link2, LayoutGrid } from 'lucide-react';
import { themes, type Theme } from './themes';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
}

const MODULE_PILLS = [
  'Document Control',
  'NC / CAPA',
  'Risk Management',
  'Internal Audits',
  'Supplier QA',
  'Training Records',
];

const STATS = [
  { icon: <ShieldCheck size={18} />, label: 'ISO 13485', sub: 'Certified' },
  { icon: <Link2 size={18} />, label: 'Hash-Chain', sub: 'Audit Trail' },
  { icon: <LayoutGrid size={18} />, label: '12 Modules', sub: 'Integrated' },
];

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * 20,
    color: Math.random() > 0.5 ? 'var(--accent)' : 'var(--accent-secondary)',
  }));
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('qms-theme') as Theme) || 'dark';
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clock, setClock] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  const particles = useMemo(() => generateParticles(40), []);

  // Apply theme CSS variables
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const vars = themes[theme];
    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, value);
    }
  }, [theme]);

  // Clock tick
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('ru-RU', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Mouse tracking (desktop only)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 1024) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  const toggleTheme = () => {
    setIsTransitioning(true);
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('qms-theme', next);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const gridTransform = `translate(${(mousePos.x - 0.5) * 8}px, ${(mousePos.y - 0.5) * 8}px)`;
  const orbCyanTransform = `translate(${(mousePos.x - 0.5) * 40}px, ${(mousePos.y - 0.5) * 40}px)`;
  const orbEmeraldTransform = `translate(${(mousePos.x - 0.5) * -30}px, ${(mousePos.y - 0.5) * -30}px)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`min-h-screen flex flex-col ${isTransitioning ? 'theme-transition' : ''}`}
      style={{
        background: `linear-gradient(135deg, var(--bg-primary), var(--bg-secondary), var(--bg-tertiary))`,
        fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif",
        ...Object.fromEntries(
          Object.entries(themes[theme]).map(([k, v]) => [k, v])
        ),
      }}
    >
      {/* ===== Background layers ===== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid */}
        <div
          className="absolute inset-0 login-grid"
          style={{ transform: gridTransform }}
        />

        {/* Glow orbs */}
        <div
          className="glow-orb glow-orb-cyan"
          style={{ transform: orbCyanTransform }}
        />
        <div
          className="glow-orb glow-orb-emerald"
          style={{ transform: orbEmeraldTransform }}
        />

        {/* Particles (hidden on mobile via CSS) */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ===== Main content ===== */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-8 lg:py-0">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-16">

          {/* ===== LEFT PANEL (hidden on mobile) ===== */}
          <div className="hidden lg:flex flex-col justify-center flex-1 anim-slide-left max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))`,
                }}
              >
                <Hexagon size={20} style={{ color: 'var(--bg-primary)' }} strokeWidth={2} />
              </div>
              <span
                className="text-sm font-medium tracking-widest uppercase"
                style={{
                  color: 'var(--text-body)',
                  fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                }}
              >
                ASVOTECH
              </span>
            </div>

            {/* Heading */}
            <h1
              className="text-5xl xl:text-6xl leading-tight mb-6"
              style={{
                fontFamily: "'Instrument Serif', serif",
                color: 'var(--text-heading)',
              }}
            >
              Quality
              <br />
              <span
                style={{
                  background: 'linear-gradient(to right, var(--accent), var(--accent-secondary))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Management
              </span>
              <br />
              System
            </h1>

            {/* Description */}
            <p
              className="text-base leading-relaxed mb-10 max-w-md"
              style={{ color: 'var(--text-body)' }}
            >
              Платформа управления качеством для производителей медицинских изделий.
              <br />
              <span
                className="text-sm"
                style={{
                  fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                  color: 'var(--text-muted)',
                }}
              >
                ISO 13485 · ГОСТ ISO 13485-2017
              </span>
            </p>

            {/* Stats */}
            <div className="flex gap-4 mb-8">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl anim-stagger-${i + 1}`}
                  style={{
                    background: 'var(--stat-bg)',
                    border: '1px solid var(--stat-border)',
                  }}
                >
                  <span style={{ color: 'var(--accent)' }}>{stat.icon}</span>
                  <div>
                    <div
                      className="text-xs font-semibold"
                      style={{
                        color: 'var(--text-heading)',
                        fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {stat.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Module pills */}
            <div className="flex flex-wrap gap-2 anim-pills">
              {MODULE_PILLS.map((pill) => (
                <span
                  key={pill}
                  className="px-3 py-1.5 rounded-full text-xs"
                  style={{
                    background: 'var(--pill-bg)',
                    border: '1px solid var(--pill-border)',
                    color: 'var(--pill-text)',
                    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* ===== RIGHT PANEL (Login card) ===== */}
          <div className="w-full max-w-md anim-slide-up">
            {/* Theme toggle */}
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleTheme}
                className="theme-toggle w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'var(--toggle-bg)',
                  border: '1px solid var(--toggle-border)',
                  color: 'var(--text-body)',
                }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Card */}
            <div
              className="glass-card rounded-2xl overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                boxShadow: `0 25px 50px -12px var(--shadow-card)`,
              }}
            >
              {/* Gradient accent line */}
              <div className="card-accent-line" />

              <div className="p-8 md:p-10">
                {/* Logo icon with spinning ring */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Spinning ring */}
                    <div
                      className="spin-ring absolute inset-0 rounded-full"
                      style={{
                        border: '2px solid transparent',
                        borderTopColor: 'var(--accent)',
                        borderRightColor: 'var(--accent-secondary)',
                        opacity: 0.4,
                      }}
                    />
                    {/* Inner icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, var(--accent), var(--accent-secondary))`,
                      }}
                    >
                      <Hexagon
                        size={28}
                        strokeWidth={1.5}
                        style={{ color: theme === 'dark' ? '#0a0e1a' : '#ffffff' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="text-2xl font-bold text-center mb-1"
                  style={{
                    color: 'var(--text-heading)',
                    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                  }}
                >
                  ASVO-QMS
                </h2>
                <p
                  className="text-sm text-center mb-8"
                  style={{ color: 'var(--text-body)' }}
                >
                  Система управления качеством
                </p>

                {/* Login button */}
                <button
                  onClick={onLogin}
                  className="btn-login w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-sm"
                  style={{
                    background: 'var(--btn-idle-bg)',
                    border: '1px solid var(--btn-idle-border)',
                    color: 'var(--accent)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--btn-hover-bg)';
                    el.style.color = 'var(--btn-hover-text)';
                    el.style.borderColor = 'var(--btn-hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = 'var(--btn-idle-bg)';
                    el.style.color = 'var(--accent)';
                    el.style.borderColor = 'var(--btn-idle-border)';
                  }}
                >
                  <ShieldCheck size={18} />
                  <span>Войти через Keycloak</span>
                </button>

                {/* SSO Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div
                    className="flex-1 h-px"
                    style={{ background: 'var(--divider-color)' }}
                  />
                  <span
                    className="text-[11px] tracking-widest uppercase"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                    }}
                  >
                    SSO
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: 'var(--divider-color)' }}
                  />
                </div>

                {/* Info block */}
                <div
                  className="rounded-xl p-4 mb-6 text-xs leading-relaxed"
                  style={{
                    background: 'var(--info-bg)',
                    border: '1px solid var(--info-border)',
                    color: 'var(--text-body)',
                  }}
                >
                  Единая авторизация через корпоративный Keycloak. Все действия
                  записываются в неизменяемый журнал аудита.
                </div>

                {/* Security badges */}
                <div
                  className="flex items-center justify-center gap-4 text-[11px]"
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Link2 size={12} style={{ color: 'var(--accent)' }} />
                    Hash-Chain
                  </span>
                  <span style={{ color: 'var(--divider-color)' }}>·</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={12} style={{ color: 'var(--accent)' }} />
                    RBAC
                  </span>
                  <span style={{ color: 'var(--divider-color)' }}>·</span>
                  <span>21 CFR 11</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Footer bar ===== */}
      <footer
        className="relative z-10 py-3 px-6 flex items-center justify-between text-[11px] anim-footer"
        style={{
          borderTop: '1px solid var(--footer-border)',
          background: 'var(--footer-bg)',
          color: 'var(--text-muted)',
          fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', monospace",
        }}
      >
        <span>© 2025 ASVOTECH · v2.1.0</span>
        <span className="hidden sm:flex items-center gap-2">
          <span
            className="pulse-indicator inline-block w-2 h-2 rounded-full"
            style={{ background: '#22c55e' }}
          />
          {clock}
        </span>
      </footer>
    </div>
  );
};
