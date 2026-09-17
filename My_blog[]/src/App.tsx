/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useAnimationFrame } from 'motion/react';
import {
  ChevronDown,
  Globe,
  Cpu,
  Zap,
  Mail,
  ExternalLink,
  Menu,
  Github,
  X,
  Star,
  Compass,
  MessageSquare,
  MessageCircle
} from 'lucide-react';
import { GargantuaSimulation } from './GargantuaSimulation';

// --- Components ---

const AtmosphericOverlay = () => {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none">
      {/* Film Grain Texture */}
      <div className="film-grain" />

      {/* Vignette and Depth */}
      <div className="absolute inset-0 bg-radial-[at_50%_50%] from-transparent via-ink-black/10 to-ink-black/80 opacity-60" />

      {/* Subtle Dust Particles (Static for performance, or could be animated) */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 1.5}px`,
              height: `${Math.random() * 1.5}px`,
              opacity: Math.random() * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, subtitle, number }: { title: string, subtitle?: string, number?: string }) => (
  <div className="mb-24 flex items-baseline gap-6">
    {number && (
      <span className="font-mono text-burning-ember text-xl tracking-tighter opacity-80">{number}</span>
    )}
    <div className="flex-1">
      <div className="flex items-center gap-4 mb-4">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-5xl uppercase tracking-[0.4em] font-extralight text-glow text-starlight"
        >
          {title}
        </motion.h2>
        <div className="h-px flex-1 bg-linear-to-r from-burning-ember/60 to-transparent" />
      </div>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.8 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-[10px] uppercase tracking-[0.8em] font-light text-nebula-gray"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  </div>
);

const OrbitingStar = ({ system, index }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0);

  useAnimationFrame((t) => {
    // Rotation: 20s per full circle, spread by index
    const angle = (t / 20000) * 360 + (index * 72);

    // Pull cycle: 10s per pull, offset by index for variety
    const pullCycle = (t / 10000 + index * 2) % (Math.PI * 2);
    // Sharp pull: use Math.pow to make it a quick dip towards center
    const pullEffect = Math.pow(Math.max(0, Math.sin(pullCycle)), 15);
    const currentDist = system.dist - (pullEffect * 180); // Pull up to 180px towards center

    const rad = (angle * Math.PI) / 180;
    x.set(Math.cos(rad) * currentDist);
    y.set(Math.sin(rad) * currentDist);

    // Scale slightly when pulled (gravitational stretching)
    scale.set(1 + pullEffect * 0.3);

    // Fade in initially
    if (opacity.get() < 1) {
      opacity.set(Math.min(1, opacity.get() + 0.02));
    }
  });

  return (
    <motion.div
      className="absolute z-30 group"
      style={{ x, y, scale, opacity }}
    >
      {/* Star Node */}
      <div className="relative flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.2 }}
          className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-ink-black/40 border border-white/10 flex items-center justify-center text-starlight hover:border-burning-ember transition-all duration-500 shadow-lg backdrop-blur-md"
          style={{ boxShadow: `0 0 30px ${system.color}33` }}
        >
          {React.cloneElement(system.icon as React.ReactElement, { strokeWidth: 1.2, color: system.color, size: 24 })}
        </motion.div>

        {/* Labels */}
        <div className="mt-4 text-center whitespace-nowrap">
          <p className="text-[11px] font-display tracking-[0.2em] text-starlight mb-1 group-hover:text-burning-ember transition-colors">{system.name}</p>
          <p className="text-[8px] uppercase tracking-[0.4em] text-nebula-gray opacity-60">{system.sub}</p>
        </div>

        {/* Tooltip/Description */}
        <div className="absolute top-full mt-6 w-48 p-4 bg-ink-black/95 border border-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none translate-y-2 group-hover:translate-y-0 backdrop-blur-2xl z-50">
          <p className="text-[10px] leading-relaxed text-starlight/80 font-light tracking-wider">
            {system.desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const ScrollConnector = () => (
  <div className="absolute left-1/2 -translate-x-1/2 h-64 w-px bg-linear-to-b from-transparent via-burning-ember/40 to-transparent z-20 pointer-events-none">
    {/* Moving Data Packet */}
    <motion.div
      className="w-2 h-2 bg-burning-ember rounded-full absolute left-1/2 -translate-x-1/2 shadow-[0_0_20px_#ff7e33]"
      animate={{
        y: [0, 256],
        opacity: [0, 1, 0],
        scale: [1, 1.5, 1]
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "linear"
      }}
    />
    {/* Static Pulse Dot */}
    <motion.div
      className="w-1.5 h-1.5 bg-white/60 rounded-full absolute left-1/2 -translate-x-1/2 top-1/2 shadow-[0_0_10px_white]"
      animate={{
        scale: [1, 2.5, 1],
        opacity: [0.3, 0.7, 0.3]
      }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
);

const ParallaxCard = ({ hobby, onClick, size = 'large' }: { hobby: { title: string, description: string, image: string, content: string }, onClick?: () => void, size?: 'large' | 'small' }) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const dimensions = size === 'large'
    ? "w-[280px] h-[380px] md:w-[320px] md:h-[420px]"
    : "w-[200px] h-[280px] md:w-[240px] md:h-[340px]";

  return (
    <div
      className="relative group perspective-1000 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      ref={cardRef}
    >
      <motion.div
        animate={{
          rotateY: isHovered ? mousePos.x * 40 : 0,
          rotateX: isHovered ? mousePos.y * -40 : 0,
          scale: isHovered ? 1.05 : 1
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.5 }}
        className={`relative ${dimensions} bg-[#111] rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Flickering Effect Overlay */}
        <motion.div
          className="absolute inset-0 z-40 pointer-events-none bg-burning-ember/5"
          animate={{
            opacity: [0, 0.1, 0, 0.05, 0, 0.15, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "mirror",
            times: [0, 0.1, 0.2, 0.4, 0.5, 0.8, 1]
          }}
        />

        {/* Background Image with Parallax */}
        <motion.div
          animate={{
            x: isHovered ? mousePos.x * -50 : 0,
            y: isHovered ? mousePos.y * -50 : 0,
            scale: 1.25
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.5 }}
          className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-1000"
          style={{
            backgroundImage: `url(${hobby.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Dynamic Glare/Shine effect */}
        <motion.div
          animate={{
            background: isHovered
              ? `radial-gradient(circle at ${50 + mousePos.x * 100}% ${50 + mousePos.y * 100}%, rgba(255,255,255,0.2) 0%, transparent 80%)`
              : 'radial-gradient(circle at 50% 50%, transparent 0%, transparent 80%)'
          }}
          className="absolute inset-0 pointer-events-none z-20"
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent opacity-90 group-hover:opacity-50 transition-opacity duration-700" />

        {/* Text Content */}
        <div
          className={`absolute inset-0 ${size === 'large' ? 'p-8' : 'p-6'} flex flex-col justify-end z-30`}
          style={{ transform: "translateZ(90px)" }}
        >
          <motion.h3
            animate={{ y: isHovered ? 0 : 20 }}
            className={`font-display ${size === 'large' ? 'text-3xl md:text-4xl' : 'text-xl md:text-2xl'} font-bold text-starlight mb-3 text-glow drop-shadow-[0_10px_10px_rgba(0,0,0,0.9)]`}
          >
            {hobby.title}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
            transition={{ duration: 0.5, delay: isHovered ? 0.1 : 0 }}
          >
            <p className={`text-starlight ${size === 'large' ? 'text-sm' : 'text-[10px]'} leading-relaxed font-light italic mb-4 drop-shadow-md`}>
              {hobby.description}
            </p>
            <div className="h-px w-16 bg-burning-ember shadow-[0_0_15px_#ff7e33] mb-4" />
            <p className={`text-starlight/80 ${size === 'large' ? 'text-[11px]' : 'text-[9px]'} leading-relaxed tracking-[0.2em] font-light uppercase`}>
              {hobby.content}
            </p>
          </motion.div>
        </div>

        {/* Border Glow Accent */}
        <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none group-hover:border-white/40 transition-colors duration-700" />
      </motion.div>
    </div>
  );
};

const ProjectCard = ({ title, description, tags }: { title: string, description: string, tags: string[] }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    className="group p-10 border-l border-white/10 hover:border-gilded-gold/60 transition-all duration-700 bg-white/[0.01] hover:bg-white/[0.03]"
  >
    <div className="flex justify-between items-start mb-6">
      <h3 className="font-display text-xl tracking-[0.3em] uppercase font-light text-starlight group-hover:text-gilded-gold transition-colors">{title}</h3>
      <ExternalLink size={14} className="opacity-0 group-hover:opacity-60 transition-opacity text-starlight" />
    </div>
    <p className="text-nebula-gray text-sm leading-relaxed font-light mb-8 tracking-wide">
      {description}
    </p>
    <div className="flex flex-wrap gap-4">
      {tags.map(tag => (
        <span key={tag} className="text-[9px] uppercase tracking-[0.4em] font-light text-starlight/60 group-hover:text-starlight transition-opacity">
          {tag}
        </span>
      ))}
    </div>
  </motion.div>
);

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEnjoyMode, setIsEnjoyMode] = useState(false);
  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
  const [enjoyTrigger, setEnjoyTrigger] = useState(0);
  const { scrollYProgress, scrollY } = useScroll();
  const [isFirstPage, setIsFirstPage] = useState(true);
  const [hoveredContact, setHoveredContact] = useState<string | null>(null);

  useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsFirstPage(latest < 100);
    });
  }, [scrollY]);

  const handleEnjoyUniverse = () => {
    setIsEnjoyMode(true);
    setEnjoyTrigger(Date.now());
    // The simulation will handle the timing, but we need to reset the UI eventually
    setTimeout(() => {
      setIsEnjoyMode(false);
    }, 8000); // 8 seconds for the full sequence
  };

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.98]);

  const hobbies = [
    {
      title: "阅读",
      description: "灵魂的避难所.",
      image: "/shu.jpg",
      content: "3年阅读时长800h+."

    },
    {
      title: "音乐",
      description: "情绪的栖息地.",
      image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=2069&auto=format&fit=crop",
      content: "主攻RNB&纯音乐."
    },
    {
      title: "健身",
      description: "自我重塑场.",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop",
      content: "6个月增肌5kg."
    },
  ];

  const books = [
    {
      title: "《纳瓦尔宝典》",
      description: "Isaac Asimov",
      image: "/s1.jpg",
      content: "在混沌的财富世界里，找到属于自己的引力锚点与内心平静."
    },
    {
      title: "《上行》",
      description: "Stanisław Lem",
      image: "/s2.jpg",
      content: "沿着时间的阶梯向上攀爬，在迷雾里凿出一条可抵达的光之路."
    },
    {
      title: "《乔布斯传》",
      description: "Frank Herbert",
      image: "/s3.jpg",
      content: "以偏执为燃料，用审美作引擎，将一个人的疯狂变成世界的模样."
    },
    {
      title: "《马可瓦尔多》",
      description: "Dan Simmons",
      image: "/s4.jpg",
      content: "庸常的城市褶皱里，为平凡日子种满会发光的诗意与幻想."
    }
  ];

  const albums = [
    {
      title: "《Ascended Vibrations》",
      description: "Teo",
      image: "/a1.jpg",
      content: "穿越空灵音景与氛围肌理之旅,绝望与重生在旋律褶皱里交织。"
    },
    {
      title: "《收敛水》",
      description: "蛋堡",
      image: "/a2.jpg",
      content: "中文说唱的爵士诗篇，慵懒flow与细腻歌词的完美融合。"
    },
    {
      title: "《黑色柳丁》",
      description: "陶喆",
      image: "/a3.png",
      content: "华语R&B巅峰之作，深邃情感与精湛编曲的经典。"
    },
    {
      title: "《Merry Christmas Mr. Lawrence》",
      description: "坂本龙一",
      image: "/a4.png",
      content: "如黑洞边缘的微光，是宿命与悲悯的钢琴独白。"
    }
  ];

  return (
    <div className="relative min-h-screen selection:bg-gilded-gold selection:text-black">
      <GargantuaSimulation enjoyTrigger={enjoyTrigger} />
      <AtmosphericOverlay />

      <AnimatePresence>
        {!isEnjoyMode && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            {/* Navigation - The Command Center */}
            <nav className="fixed top-0 left-0 w-full z-50 p-8 md:p-12 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                className="font-display text-sm tracking-[0.8em] uppercase font-light mix-blend-difference"

              >
                <AnimatePresence>
                  {isFirstPage && !isMenuOpen && (
                    <motion.button
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                      onClick={handleEnjoyUniverse}
                      className="text-[9px] uppercase tracking-[0.4em] font-light text-starlight border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm hover:border-burning-ember/50 transition-all"
                    >
                      Enjoy the Universe
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>

              <div className="flex flex-col items-end gap-4">
                <button
                  className="z-50 p-4 hover:bg-white/5 rounded-full transition-colors group"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <div className="w-6 h-5 flex flex-col justify-between">
                    <motion.span
                      animate={isMenuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                      className="w-full h-px bg-starlight block origin-left transition-all"
                    />
                    <motion.span
                      animate={isMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                      className="w-full h-px bg-starlight block transition-all"
                    />
                    <motion.span
                      animate={isMenuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                      className="w-full h-px bg-starlight block origin-left transition-all"
                    />
                  </div>
                </button>


              </div>
            </nav>

            {/* Navigation Overlay */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-40 bg-ink-black/95 backdrop-blur-2xl flex flex-col md:flex-row"
                >
                  <div className="flex-1 flex flex-col items-center justify-center p-12 gap-8">
                    {[
                      { name: 'Home', href: '#', num: '00' },
                      { name: 'About', href: '#about', num: '01' },
                      { name: 'Explorations', href: '#explorations', num: '02' },
                      { name: 'Hobbies', href: '#hobbies', num: '03' },
                      { name: 'Skills', href: '#skills', num: '04' },
                      { name: 'Signal', href: '#signal', num: '05' }
                    ].map((item, i) => (
                      <motion.a
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="group relative font-display text-3xl md:text-5xl tracking-[0.6em] uppercase font-extralight hover:text-gilded-gold transition-colors"
                      >
                        <span className="absolute -left-12 top-1/2 -translate-y-1/2 text-[10px] tracking-widest text-burning-ember/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.num}
                        </span>
                        {item.name}
                      </motion.a>
                    ))}
                  </div>
                  <div className="w-full md:w-1/3 bg-white/[0.02] border-l border-white/5 p-12 flex flex-col justify-end gap-12">
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-[0.5em] text-nebula-gray">Coordinates</p>
                      <p className="text-xs tracking-widest font-light">34.0522° N, 118.2437° W</p>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] uppercase tracking-[0.5em] text-nebula-gray">Current Status</p>
                      <p className="text-xs tracking-widest font-light">Exploring the Event Horizon</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hero Section - The Cosmic Cathedral */}
            <section className="relative h-screen flex flex-col items-center justify-center text-center px-6">
              <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="z-10 space-y-16">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: 0.5, duration: 2 }}
                  className="text-[10px] md:text-xs uppercase tracking-[1.2em] font-light"
                >
                  Go Further
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, letterSpacing: '0.4em' }}
                  animate={{ opacity: 1, letterSpacing: '1.2em' }}
                  transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
                  className="font-display text-4xl md:text-7xl lg:text-8xl uppercase font-thin leading-none text-glow"
                >
                  welcome
                </motion.h1>

                <motion.div

                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 2 }}
                  className="max-w-xl mx-auto"
                >
                  <p className="text-[11px] md:text-xs uppercase tracking-[0.6em] leading-loose font-light text-starlight">
                    The scorching pulse of the universe’s breath.<br />
                    宇宙呼吸的灼热脉搏<br />

                    A pure dialogue between light and shadow.<br />
                    光与影的纯粹对话
                  </p>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="pt-24 opacity-20"
                >
                  <ChevronDown size={24} strokeWidth={1} />
                </motion.div>
              </motion.div>
            </section>

            {/* About Me - The Biological Component */}
            <section id="about" className="relative py-48 px-8 max-w-7xl mx-auto backdrop-blur-[2px]">
              <SectionHeader title="关于我" subtitle="The Biological Component" number="01" />

              <div className="grid lg:grid-cols-2 gap-24 items-start">
                <div className="space-y-16">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-12"
                  >
                    <p className="text-starlight text-xl md:text-2xl leading-relaxed font-light tracking-wide">
                      I am Lawrence <br />
                      a <span className="text-burning-ember font-medium">
                        creative explorer</span> and <span className="text-gilded-gold font-medium">livelong grower</span>
                      <br />我是Lawrence<br />数字探索者&终身成长者
                    </p>

                    <p className="text-starlight/90 text-sm md:text-base leading-loose font-light tracking-wider">
                      这是我的个人博客，很高兴与你相遇，<br />
                      我始终认为，创作和表达是很酷的事情，  <br />
                      也是与世界产生交互的一种方式.<br />
                      我真诚地欢迎你与我连接 希望认识更多的朋友,<br />
                      探索世界,共同成长.
                      <br />
                    </p>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: 'Projects', value: '10+' },
                      { label: 'Codeyear', value: '1Y+' },
                      { label: 'Lifeprocess', value: '9.88%' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white/[0.03] border border-white/10 p-8 rounded-xl text-center group hover:border-burning-ember transition-colors">
                        <p className="text-3xl font-display font-light text-burning-ember mb-2">{stat.value}</p>
                        <p className="text-[9px] uppercase tracking-[0.4em] text-starlight/60">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-ink-black/40 border border-white/20 rounded-2xl p-8 font-mono text-xs leading-relaxed shadow-2xl relative overflow-hidden group backdrop-blur-md"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-burning-ember via-gilded-gold to-transparent opacity-60" />
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50 border border-yellow-500/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/50 border border-green-500/30" />
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.4em] text-starlight/40 font-light">information.py</div>
                  </div>
                  <pre className="text-starlight overflow-x-auto">
                    <code>
                      {`class IntroduceMyself :
    def __init__(self):
        self.version = '21.0.0';

        self.region = 'Guangzhou';

        self.school = 'GDUT';

        self.MBTI = 'ENTJ';

        self.slogan='think_bold';
    

  def teach_yourself(anything):
    while not create(something):
        learn()
        practice()
    return teach_yourself("anything")

teach_yourself(anything)
`}
                    </code>
                  </pre>
                  <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center opacity-60">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-burning-ember animate-pulse" />
                      <span className="text-[9px] uppercase tracking-[0.2em] text-starlight">Live Telemetry</span>
                    </div>
                    <span className="text-[9px] text-starlight">UTF-8</span>
                  </div>
                </motion.div>
              </div>
              <ScrollConnector />
            </section>

            {/* Life System Dashboard - The Celestial Engine */}
            <section id="explorations" className="relative py-48 px-8 max-w-7xl mx-auto">
              <SectionHeader title="人生系统仪表盘" subtitle="Life System Dashboard" number="02" />

              <div className="relative h-[600px] md:h-[800px] w-full flex items-center justify-center overflow-hidden">
                {/* The Five Systems (Orbiting Stars) */}
                {[
                  {
                    id: 'input',
                    name: '瀚海藏星',
                    sub: '输入系统',
                    icon: <Globe />,
                    color: '#4a9eff',
                    dist: 280,
                    desc: '知识摄取与信息解构，构建认知的深海。'
                  },
                  {
                    id: 'output',
                    name: '千机脉轮',
                    sub: '输出系统',
                    icon: <Cpu />,
                    color: '#ff7e33',
                    dist: 300,
                    desc: '价值创造与表达反馈，驱动逻辑的轮转。'
                  },
                  {
                    id: 'growth',
                    name: '外附魂骨',
                    sub: '成长系统',
                    icon: <Zap />,
                    color: '#d4af37',
                    dist: 260,
                    desc: '技能进化与能力跃迁，强化生命的骨架。'
                  },
                  {
                    id: 'finance',
                    name: '准财铢玑',
                    sub: '财务系统',
                    icon: <Star />,
                    color: '#00ffcc',
                    dist: 320,
                    desc: '资产配置与财富积累，计算未来的概率。'
                  },
                  {
                    id: 'energy',
                    name: '强磁脉冲',
                    sub: '能量系统',
                    icon: <Zap />,
                    color: '#ff3366',
                    dist: 280,
                    desc: '身心管理与驱动核心，爆发持续的动力。'
                  }
                ].map((system, i) => (
                  <OrbitingStar key={system.id} system={system} index={i} />
                ))}

                {/* Background Constellation Lines - More subtle and dynamic */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5">
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="280"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    strokeDasharray="4,8"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  />
                </svg>
              </div>
              <ScrollConnector />
            </section>

            {/* Hobbies - Parallax Depth Cards */}
            <section id="hobbies" className="relative py-48 w-full backdrop-blur-[2px] overflow-hidden">
              <div className="max-w-7xl mx-auto px-8">
                <SectionHeader title="爱好" subtitle="Biological Calibration" number="03" />

                <div className="flex flex-col items-center gap-24">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 justify-items-center w-full">
                    {hobbies.map((hobby, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, duration: 0.8 }}
                        className="group"
                      >
                        <ParallaxCard
                          hobby={hobby}
                          onClick={() => {
                            if (hobby.title === "阅读") {
                              setSelectedHobby(selectedHobby === "阅读" ? null : "阅读");
                            } else if (hobby.title === "音乐") {
                              setSelectedHobby(selectedHobby === "音乐" ? null : "音乐");
                            }
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <AnimatePresence>
                    {selectedHobby === "阅读" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full overflow-hidden"
                      >
                        <div className="pt-12 pb-8 text-center">
                          <h4 className="text-[10px] uppercase tracking-[0.6em] text-gilded-gold mb-16 font-light">Archives: Selected Volumes</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                            {books.map((book, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                              >
                                <ParallaxCard hobby={book} size="small" />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {selectedHobby === "音乐" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full overflow-hidden"
                      >
                        <div className="pt-12 pb-8 text-center">
                          <h4 className="text-[10px] uppercase tracking-[0.6em] text-gilded-gold mb-16 font-light">Playlist: Selected Albums</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                            {albums.map((album, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                              >
                                <ParallaxCard hobby={album} size="small" />
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <ScrollConnector />
            </section>

            {/* Skills & Resume - The Anchor of Order */}
            <section id="skills" className="relative py-48 px-8 backdrop-blur-[2px] overflow-hidden">
              {/* Subtle Background Grid */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

              <div className="max-w-7xl mx-auto relative z-10">
                <SectionHeader title="技能 & 简历" subtitle="The Technical Foundation" number="04" />

                <div className="grid lg:grid-cols-12 gap-24">
                  {/* Skills Column */}
                  <div className="lg:col-span-4 space-y-16">
                    <div className="bg-white/[0.01] border border-white/10 p-10 rounded-3xl backdrop-blur-sm">
                      <h4 className="text-[10px] uppercase tracking-[0.6em] text-gilded-gold mb-12 font-light">Core Competencies</h4>
                      <div className="space-y-10">
                        {[
                          { name: '前端架构设计', level: 80 },
                          { name: '办公工具', level: 70 },
                          { name: '智能体', level: 40 },
                          { name: '写作', level: 70 }
                        ].map((skill) => (
                          <div key={skill.name} className="space-y-4">
                            <div className="flex justify-between text-[9px] uppercase tracking-[0.3em] font-light">
                              <span className="text-starlight">{skill.name}</span>
                              <span className="opacity-60 text-starlight">{skill.level}%</span>
                            </div>
                            <div className="h-[1px] w-full bg-white/10 relative">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${skill.level}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="absolute inset-0 bg-linear-to-r from-burning-ember to-gilded-gold"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-12 px-4">
                      <h4 className="text-[10px] uppercase tracking-[0.6em] text-gilded-gold mb-8 font-light">Tools of Choice</h4>
                      <div className="flex flex-wrap gap-3">
                        {['html', 'css', 'javascript', 'Vue', 'Node.js', 'TypeScript', 'Tailwind', 'PostgreSQL', 'Github'].map(tool => (
                          <span key={tool} className="px-4 py-2 bg-white/[0.02] border border-white/10 rounded-full text-[8px] uppercase tracking-widest font-light text-starlight/80 hover:text-starlight hover:border-burning-ember/50 hover:bg-burning-ember/10 transition-all cursor-default">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Experience Column */}
                  <div className="lg:col-span-8 space-y-16">
                    <h4 className="text-[10px] uppercase tracking-[0.6em] text-gilded-gold mb-12 font-light ml-4">Portfolio</h4>
                    <div className="space-y-16">
                      {[
                        {
                          role: 'TimeQuest',
                          company: 'Vue3+TypeScript+Sqlite+Node.js ',
                          period: '2026.02-2026.03',
                          description: `一个旨在解决成长焦虑和结果导向的、集合项目管理、时间管理、经济管理的工具.以柳比歇夫记录法为基础开发时间管理模块，设置自定义活动类别便于分类统计，同时创新性的打造时间负债板块，支持时间价值可视化。`
                        },
                        {
                          role: 'bili总结助手',
                          company: 'Python',
                          period: '2025.12 - 2026.01',
                          description: '一个基于Python的工具，可以自动抓取B站某UP主的所有视频，提取字幕或音频转文字，然后使用大模型API（如GPT-3.5）提炼每个视频的核心观点，最终将结果保存为Excel/Markdown/JSON格式。'
                        },
                        {
                          role: 'Vellum深页',
                          company: 'Python+PostgreSQL+FastAPI',
                          period: '2026.01 - 2026.03',
                          description: '数字顾问笔记是一个"像私人笔记本"的网页应用，让你可以创建属于自己的数字顾问团。将喜爱的博主智慧珍藏于此，通过上传他们的文章、视频转录等内容，让AI学习他们的风格，随时翻开与他们深度对话。'
                        }
                      ].map((job, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          className="relative group px-8 py-10 rounded-3xl hover:bg-white/[0.02] border border-transparent hover:border-white/10 transition-all duration-500"
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
                            <div>
                              <h5 className="font-display text-2xl tracking-[0.2em] uppercase font-thin mb-3 text-starlight group-hover:text-gilded-gold transition-colors duration-500">{job.role}</h5>
                              <p className="text-burning-ember text-[10px] capitalize tracking-[0.5em] font-light">{job.company}</p>
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.4em] text-starlight/40 font-light bg-white/[0.03] px-4 py-1.5 rounded-full border border-white/10">{job.period}</span>
                          </div>
                          <p className="text-starlight/80 text-sm leading-relaxed tracking-widest font-light max-w-2xl italic">
                            {job.description}
                          </p>
                          <div className="mt-12 h-px w-full bg-linear-to-r from-white/20 to-transparent" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <ScrollConnector />
            </section>

            {/* Signal (Contact) - Faint Existence */}
            <section id="signal" className="relative py-48 px-8 text-center bg-white/[0.01] backdrop-blur-[2px]">
              <div className="max-w-2xl mx-auto space-y-16">
                <SectionHeader title="Contact Me" />

                <div className="flex justify-center gap-12 md:gap-20 pt-8">
                  {[
                    { icon: <MessageSquare />, label: 'WeChat', value: 'WeChat ID:vdse12345', href: '#' },
                    { icon: <MessageCircle />, label: 'QQ', value: 'QQ:2491569187', href: '#' },
                    { icon: <Mail />, label: 'phone', value: 'a1438574qq@gmail.com', href: 'mailto:a1438574qq@gmail.com' },
                    { icon: <Github />, label: 'GitHub', value: 'github.com/cooper', href: 'https://github.com' }
                  ].map((link, i) => (
                    <motion.a
                      key={i}
                      onMouseEnter={() => setHoveredContact(link.value)}
                      onMouseLeave={() => setHoveredContact(null)}
                      whileHover={{ y: -5, opacity: 1, color: '#ff7e33' }}
                      href={link.href}
                      className="flex flex-col items-center gap-4 opacity-60 text-starlight transition-all group"
                    >
                      <div className="p-4 rounded-full border border-white/5 group-hover:border-burning-ember/30 group-hover:bg-white/[0.02] transition-all duration-500">
                        {React.cloneElement(link.icon as React.ReactElement, { strokeWidth: 1, size: 28 })}
                      </div>
                      <div className="h-4 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={hoveredContact === link.value ? 'value' : 'label'}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-[10px] uppercase tracking-[0.4em] font-light whitespace-nowrap"
                          >
                            {hoveredContact === link.value ? link.value : link.label}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
