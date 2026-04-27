"use client";
import { useEffect } from "react";
import { useTranslation } from "./locales";
import { useSelector } from 'react-redux';
import { selectToken } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import ComponentsAuthLoginForm from '@/components/auth/components-auth-login-form';

export default function Home() {
  const t      = useTranslation();
  const token  = useSelector(selectToken);
  const router = useRouter();

  useEffect(() => {
    if (token) router.push('/admin/dashboard');
  }, []);

  return (
    <>
      <style>{`
        @keyframes float-a {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%      { transform: translateY(-18px) rotate(4deg); }
          66%      { transform: translateY(-8px) rotate(-2deg); }
        }
        @keyframes float-b {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(-5deg); }
        }
        @keyframes float-c {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes drift {
          0%,100% { transform: translate(0,0) rotate(0deg); }
          25%      { transform: translate(10px,-8px) rotate(5deg); }
          75%      { transform: translate(-8px,10px) rotate(-3deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulse-orb {
          0%,100% { opacity:0.5; transform:scale(1); }
          50%      { opacity:0.8; transform:scale(1.06); }
        }
        @keyframes card-in {
          from { opacity:0; transform:translateY(24px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes blink-dot {
          0%,100% { opacity:0.9; }
          50%      { opacity:0.2; }
        }

        .fa  { animation: float-a   9s  ease-in-out infinite; }
        .fb  { animation: float-b   7s  ease-in-out infinite; }
        .fc  { animation: float-c  11s  ease-in-out infinite; }
        .fd  { animation: drift    13s  ease-in-out infinite; }
        .ss  { animation: spin-slow 26s linear infinite; }
        .po  { animation: pulse-orb  6s ease-in-out infinite; }
        .ci  { animation: card-in  0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .bd  { animation: blink-dot 2.4s ease-in-out infinite; }

        /* Fondo amarillo dorado refinado — menos saturado que el original */
        .login-bg {
          background-color: #d4920a;
          background-image:
            radial-gradient(ellipse 70% 55% at 0%   0%,  #f5a623 0%, transparent 55%),
            radial-gradient(ellipse 60% 50% at 100% 100%, #b87a08 0%, transparent 55%),
            radial-gradient(ellipse 40% 35% at 50% 50%,  #e8a012 0%, transparent 60%),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='1' cy='1' r='0.8' fill='rgba(0,0,0,0.06)'/%3E%3C/svg%3E");
        }

        /* Card — fondo blanco translúcido igual al original pero más refinado */
        .login-card {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow:
            0 32px 80px rgba(0,0,0,0.18),
            0 8px 24px rgba(180,120,0,0.15),
            0 1px 0 rgba(255,255,255,0.9) inset;
        }

        /* Formas geométricas — tonos dorados oscuros para verse sobre el fondo */
        .geo {
          position:absolute; pointer-events:none;
          border: 1.5px solid rgba(120,70,0,0.18);
          background: rgba(255,200,50,0.12);
        }
        .geo-ring {
          position:absolute; pointer-events:none;
          border-radius:50%;
          border: 1.5px solid rgba(120,70,0,0.15);
        }

        /* Hexágono decorativo — referencia al original */
        .hex {
          position:absolute; pointer-events:none;
          width: 0; height: 0;
          opacity: 0.18;
        }
      `}</style>

      <div className="login-bg min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

        {/* Orbs dorados */}
        <div className="po absolute rounded-full pointer-events-none"
          style={{ width:500, height:500, background:'radial-gradient(circle,rgba(255,220,80,0.5),transparent 65%)', top:'-20%', left:'-15%' }} />
        <div className="po absolute rounded-full pointer-events-none"
          style={{ width:420, height:420, background:'radial-gradient(circle,rgba(180,100,0,0.35),transparent 65%)', bottom:'-15%', right:'-12%', animationDelay:'3s' }} />
        <div className="po absolute rounded-full pointer-events-none"
          style={{ width:280, height:280, background:'radial-gradient(circle,rgba(255,200,50,0.3),transparent 65%)', top:'40%', right:'18%', animationDelay:'1.5s' }} />

        {/* Anillos giratorios */}
        <div className="geo-ring ss absolute"
          style={{ width:320, height:320, top:'3%', right:'4%', animationDuration:'30s' }} />
        <div className="geo-ring ss absolute"
          style={{ width:200, height:200, top:'8%', right:'9%', border:'1.5px solid rgba(120,70,0,0.10)', animationDuration:'22s', animationDirection:'reverse' }} />
        <div className="geo-ring ss absolute"
          style={{ width:160, height:160, bottom:'7%', left:'4%', animationDuration:'26s' }} />
        <div className="geo-ring ss absolute"
          style={{ width:100, height:100, bottom:'14%', left:'9%', animationDuration:'18s', animationDirection:'reverse' }} />

        {/* Rectángulos flotantes */}
        <div className="geo fa rounded-2xl" style={{ width:110, height:110, top:'6%',     left:'4%',   animationDelay:'0s'   }} />
        <div className="geo fb rounded-xl"  style={{ width:60,  height:60,  top:'16%',    left:'12%',  animationDelay:'1s',   transform:'rotate(20deg)' }} />
        <div className="geo fc rounded-2xl" style={{ width:90,  height:90,  bottom:'10%', left:'2%',   animationDelay:'2s',   transform:'rotate(-12deg)' }} />
        <div className="geo fa rounded-lg"  style={{ width:40,  height:40,  bottom:'21%', left:'10%',  animationDelay:'0.5s', transform:'rotate(38deg)' }} />
        <div className="geo fb rounded-2xl" style={{ width:80,  height:80,  top:'8%',     right:'16%', animationDelay:'1.5s', transform:'rotate(16deg)' }} />
        <div className="geo fc rounded-xl"  style={{ width:68,  height:68,  bottom:'13%', right:'6%',  animationDelay:'3s',   transform:'rotate(-22deg)' }} />
        <div className="geo fd rounded-lg"  style={{ width:44,  height:44,  bottom:'26%', right:'16%', animationDelay:'1s',   transform:'rotate(12deg)' }} />
        <div className="geo fa rounded-xl"  style={{ width:52,  height:52,  top:'2%',     left:'40%',  animationDelay:'2.5s', transform:'rotate(-9deg)' }} />
        <div className="geo fb rounded-lg"  style={{ width:35,  height:35,  top:'45%',    left:'2%',   animationDelay:'3.5s', transform:'rotate(25deg)' }} />
        <div className="geo fc rounded-xl"  style={{ width:58,  height:58,  top:'25%',    right:'3%',  animationDelay:'0.8s', transform:'rotate(-15deg)' }} />

        {/* Líneas decorativas */}
        <div className="absolute pointer-events-none fd"
          style={{ width:130, height:2, background:'linear-gradient(90deg,transparent,rgba(120,70,0,0.25),transparent)', top:'33%', left:'1%' }} />
        <div className="absolute pointer-events-none fb"
          style={{ width:90, height:2, background:'linear-gradient(90deg,transparent,rgba(120,70,0,0.2),transparent)', bottom:'37%', right:'2%', animationDelay:'1.5s' }} />
        <div className="absolute pointer-events-none fc"
          style={{ width:70, height:2, background:'linear-gradient(90deg,transparent,rgba(120,70,0,0.15),transparent)', top:'60%', left:'1%', animationDelay:'2s' }} />

        {/* Puntos parpadeantes */}
        {[
          { top:'28%', left:'7%',   delay:'0s'   },
          { top:'58%', left:'4%',   delay:'0.8s' },
          { top:'18%', right:'11%', delay:'1.2s' },
          { top:'73%', right:'5%',  delay:'0.4s' },
          { top:'48%', left:'18%',  delay:'1.8s' },
          { top:'82%', right:'20%', delay:'2.2s' },
        ].map((pos, i) => (
          <div key={i} className="bd absolute rounded-full pointer-events-none"
            style={{ width:6, height:6, background:'rgba(120,70,0,0.4)', animationDelay:pos.delay, ...pos }} />
        ))}

        {/* Card — igual al original: centrado, fondo blanco translúcido */}
        <div className="ci login-card w-full max-w-[480px] rounded-2xl px-10 py-12 relative z-10">

          {/* Título */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold uppercase leading-snug text-gray-800 md:text-4xl">
              {t.sign_in}
            </h1>
            <p className="text-sm font-medium text-gray-500 mt-1">
              {t.sign_in_description}
            </p>
          </div>

          {/* Logo — grande, igual al original */}
          <div className="flex justify-center mb-8">
            <img
              src="/assets/images/logo.png"
              alt="logo"
              className="w-full sm:w-3/4 object-contain"
            />
          </div>

          {/* Formulario */}
          {!token && <ComponentsAuthLoginForm />}

        </div>

        {/* Pie */}
        <p className="absolute bottom-5 text-xs font-medium" style={{ color:'rgba(100,60,0,0.5)' }}>
          © {new Date().getFullYear()} — Sistema de Gestión Daxparts
        </p>

      </div>
    </>
  );
}