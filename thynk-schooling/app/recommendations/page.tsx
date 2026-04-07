<section style={{ padding: 'clamp(32px,5vw,72px) clamp(20px,5vw,80px)' }}>
  <div style={{ maxWidth: 'var(--container-width,1400px)', margin: '0 auto' }}>

    <div style={{ textAlign: 'center', padding: '40px 0', marginBottom: 32 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
      <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 36, marginBottom: 12 }}>
        AI-Powered School Matching
      </h2>
      <p style={{ fontSize: 18, color: '#4A5568', maxWidth: 560, margin: '0 auto' }}>
        Our AI analyses your child's needs, budget, location preferences, and academic goals
        to recommend the best-fit schools.
      </p>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, margin: '32px 0' }}>
      {[
        { icon: '📋', title: 'Share Preferences', desc: 'Tell us about your child — board preference, budget, location, activities, class level.' },
        { icon: '⚡', title: 'AI Analyses',        desc: 'Our algorithm matches your requirements against 12,000+ verified schools in real time.' },
        { icon: '🎯', title: 'Get Matches',         desc: 'Receive your top 10 personalised school recommendations with detailed comparisons.' },
      ].map(({ icon, title, desc }) => (
        <div key={title} style={{ background: '#F5F0E8', borderRadius: 14, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      ))}
    </div>

    <div style={{ textAlign: 'center', marginTop: 32 }}>
      <a href="/schools" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', background: '#B8860B', color: '#fff', textDecoration: 'none', borderRadius: 10, fontFamily: 'DM Sans,sans-serif', fontSize: 16, fontWeight: 700 }}>
        Find My Schools →
      </a>
    </div>

  </div>
</section>
