import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Target, Users, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const modos = [
  {
    icon: "🎱",
    label: "Bola 8",
    desc: "Encaçape suas bolas e a bola 8 para vencer",
    path: "/jogo?mode=8ball",
    color: "from-green-900 to-green-800",
    border: "border-green-700",
  },
  {
    icon: "🟡",
    label: "Sinuca Brasileira",
    desc: "Regras clássicas da sinuca do Brasil",
    path: "/jogo?mode=sinuca",
    color: "from-yellow-900 to-yellow-800",
    border: "border-yellow-700",
  },
  {
    icon: "🎯",
    label: "Modo Treino",
    desc: "Pratique sem pressão e melhore sua técnica",
    path: "/jogo?mode=treino",
    color: "from-blue-900 to-blue-800",
    border: "border-blue-700",
  },
  {
    icon: "👥",
    label: "2 Jogadores",
    desc: "Jogue com um amigo no mesmo dispositivo",
    path: "/jogo?mode=2p",
    color: "from-purple-900 to-purple-800",
    border: "border-purple-700",
  },
];

export default function MenuJogo() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(ellipse at center, #0d2010 0%, #060d06 100%)" }}>

      <Link to="/" className="absolute top-4 left-4">
        <Button variant="ghost" className="text-muted-foreground gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao site
        </Button>
      </Link>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-20 h-20 rounded-full bg-primary mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
          <span className="font-bebas text-4xl text-primary-foreground">8</span>
        </div>
        <h1 className="font-bebas text-5xl text-foreground tracking-widest">SINUCA BRASILEIRA</h1>
        <p className="text-muted-foreground mt-2">Escolha o modo de jogo</p>
      </motion.div>

      {/* Modos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {modos.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={m.path}>
              <div className={`group p-5 rounded-2xl border ${m.border} bg-gradient-to-br ${m.color} hover:scale-[1.02] transition-all cursor-pointer`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{m.icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{m.label}</h3>
                    <p className="text-muted-foreground text-sm">{m.desc}</p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* How to play */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="mt-10 max-w-lg w-full bg-card/30 border border-border/30 rounded-2xl p-6">
        <h3 className="font-bold text-foreground mb-4 text-center">Como Jogar</h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <div className="flex gap-2"><span>🖱️</span><span>Mova o mouse para mirar</span></div>
          <div className="flex gap-2"><span>🖱️</span><span>Segure o clique para carregar</span></div>
          <div className="flex gap-2"><span>⌨️</span><span>Setas ← → ajustam a mira</span></div>
          <div className="flex gap-2"><span>⎵</span><span>Espaço para tacar</span></div>
          <div className="flex gap-2"><span>📱</span><span>Toque e segure na mesa</span></div>
          <div className="flex gap-2"><span>🔄</span><span>R = reiniciar a partida</span></div>
        </div>
      </motion.div>
    </div>
  );
}
