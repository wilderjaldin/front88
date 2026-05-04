'use client';

const rings = [
  { w: 320, h: 320, pos: { top: '-8%',    right: '-6%'  }, dur: '28s', dir: 'normal'  },
  { w: 210, h: 210, pos: { top: '-2%',    right: '-1%'  }, dur: '21s', dir: 'reverse' },
  { w: 260, h: 260, pos: { bottom: '-10%',left: '-6%'   }, dur: '24s', dir: 'normal'  },
  { w: 160, h: 160, pos: { bottom: '-4%', left: '-1%'   }, dur: '18s', dir: 'reverse' },
];

const shapes = [
  { w: 90, h: 90,  pos: { top: '8%',     left: '3%'    }, rot: 15,  dur: '8s',  delay: '0s'   , anim: 'auth-fa' },
  { w: 55, h: 55,  pos: { top: '18%',    left: '12%'   }, rot: -20, dur: '7s',  delay: '1s'   , anim: 'auth-fb' },
  { w: 72, h: 72,  pos: { bottom: '12%', left: '3%'    }, rot: 10,  dur: '9s',  delay: '2s'   , anim: 'auth-fc' },
  { w: 44, h: 44,  pos: { bottom: '23%', left: '14%'   }, rot: -35, dur: '6s',  delay: '0.5s' , anim: 'auth-fa' },
  { w: 82, h: 82,  pos: { top: '6%',     right: '5%'   }, rot: 20,  dur: '10s', delay: '1.5s' , anim: 'auth-fb' },
  { w: 58, h: 58,  pos: { top: '25%',    right: '3%'   }, rot: -15, dur: '8s',  delay: '3s'   , anim: 'auth-fc' },
  { w: 50, h: 50,  pos: { bottom: '18%', right: '8%'   }, rot: 30,  dur: '7s',  delay: '1s'   , anim: 'auth-fa' },
  { w: 36, h: 36,  pos: { bottom: '32%', right: '18%'  }, rot: -10, dur: '9s',  delay: '2s'   , anim: 'auth-fd' },
  { w: 65, h: 65,  pos: { top: '42%',    left: '2%'    }, rot: 8,   dur: '11s', delay: '0.8s' , anim: 'auth-fb' },
  { w: 48, h: 48,  pos: { top: '60%',    right: '4%'   }, rot: -25, dur: '8s',  delay: '3.5s' , anim: 'auth-fc' },
];

const dots = [
  { pos: { top: '24%', left: '7%'    }, delay: '0s'   },
  { pos: { top: '50%', left: '4%'    }, delay: '0.8s' },
  { pos: { top: '76%', left: '9%'    }, delay: '1.6s' },
  { pos: { top: '14%', right: '10%'  }, delay: '0.4s' },
  { pos: { top: '44%', right: '5%'   }, delay: '1.2s' },
  { pos: { top: '68%', right: '7%'   }, delay: '2.0s' },
];

const lines = [
  { w: 130, pos: { top: '35%',    left: '1%'   }, delay: '0s'   },
  { w: 90,  pos: { bottom: '38%', right: '2%'  }, delay: '1.5s' },
  { w: 70,  pos: { top: '62%',    left: '1%'   }, delay: '2.5s' },
];

export default function AuthBackground() {
  return (
    <>
      <style>{`
        @keyframes auth-float-a {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%      { transform: translateY(-20px) rotate(5deg); }
          66%      { transform: translateY(-9px) rotate(-2deg); }
        }
        @keyframes auth-float-b {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-16px) rotate(-6deg); }
        }
        @keyframes auth-float-c {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-24px) rotate(4deg); }
        }
        @keyframes auth-drift {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          25%      { transform: translate(12px,-10px) rotate(6deg); }
          75%      { transform: translate(-10px,12px) rotate(-4deg); }
        }
        @keyframes auth-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes auth-pulse {
          0%,100% { opacity:0.3; transform:scale(1); }
          50%      { opacity:0.6; transform:scale(1.05); }
        }
        @keyframes auth-blink {
          0%,100% { opacity:0.8; }
          50%      { opacity:0.12; }
        }
        @keyframes auth-slide {
          0%,100% { opacity:0.3; transform:scaleX(1) translateX(0); }
          50%      { opacity:0.12; transform:scaleX(0.65) translateX(18px); }
        }

        .auth-fa { animation: auth-float-a 8s  ease-in-out infinite; }
        .auth-fb { animation: auth-float-b 7s  ease-in-out infinite; }
        .auth-fc { animation: auth-float-c 10s ease-in-out infinite; }
        .auth-fd { animation: auth-drift   13s ease-in-out infinite; }
        .auth-ss { animation: auth-spin    28s linear      infinite; }
        .auth-po { animation: auth-pulse    6s ease-in-out infinite; }
        .auth-bd { animation: auth-blink  2.6s ease-in-out infinite; }
        .auth-sl { animation: auth-slide    9s ease-in-out infinite; }
      `}</style>

      {/* Orbs ámbar pulsantes */}
      <div className="auth-po absolute pointer-events-none" style={{
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.05), transparent 60%)',
        top: '-25%', left: '-20%',
      }} />
      <div className="auth-po absolute pointer-events-none" style={{
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.03), transparent 60%)',
        bottom: '-20%', right: '-15%',
        animationDelay: '3s',
      }} />

      {/* Grid sutil */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(255,255,255,0.008) 59px,rgba(255,255,255,0.008) 60px),repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(255,255,255,0.008) 59px,rgba(255,255,255,0.008) 60px)',
      }} />

      {/* Anillos giratorios */}
      {rings.map((r, i) => (
        <div key={i}
          className="auth-ss absolute rounded-full pointer-events-none"
          style={{
            width: r.w, height: r.h,
            border: '1px solid rgba(245,158,11,0.06)',
            animationDuration: r.dur,
            animationDirection: r.dir as any,
            ...r.pos,
          }}
        />
      ))}

      {/* Rectángulos flotantes */}
      {shapes.map((s, i) => (
        <div key={i}
          className={`${s.anim} absolute rounded-xl pointer-events-none`}
          style={{
            width: s.w, height: s.h,
            border: '1px solid rgba(245,158,11,0.08)',
            background: 'rgba(245,158,11,0.02)',
            transform: `rotate(${s.rot}deg)`,
            animationDuration: s.dur,
            animationDelay: s.delay,
            ...s.pos,
          }}
        />
      ))}

      {/* Líneas deslizantes */}
      {lines.map((l, i) => (
        <div key={i}
          className="auth-sl absolute pointer-events-none"
          style={{
            width: l.w, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)',
            animationDelay: l.delay,
            ...l.pos,
          }}
        />
      ))}

      {/* Puntos parpadeantes */}
      {dots.map((d, i) => (
        <div key={i}
          className="auth-bd absolute rounded-full pointer-events-none"
          style={{
            width: 5, height: 5,
            background: 'rgba(245,158,11,0.25)',
            animationDelay: d.delay,
            ...d.pos,
          }}
        />
      ))}
    </>
  );
}
