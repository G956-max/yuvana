import { motion } from 'motion/react';
import { Leaf, ShieldCheck, Sparkles, Award, Target, Eye, MessageCircle, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

interface AboutProps {
  onNavigate: (page: string) => void;
}

const features = [
  { icon: Leaf, titleKey: 'natural', descKey: 'naturalDesc' },
  { icon: ShieldCheck, titleKey: 'chemicalFree', descKey: 'chemicalFreeDesc' },
  { icon: Award, titleKey: 'quality', descKey: 'qualityDesc' },
  { icon: Sparkles, titleKey: 'traditional', descKey: 'traditionalDesc' },
];

export default function About({ onNavigate }: AboutProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-beige selection:bg-secondary/30 overflow-x-hidden pt-[70px]">
      <Navbar onNavigate={onNavigate} currentPage="about" />

      {/* Hero Section */}
      <section className="relative h-[55vh] min-h-[400px] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=2000" 
            alt="Herbal background" 
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]" />
        </div>
        
        <div className="relative z-10 text-center px-4 md:px-10">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] md:text-xs font-medium tracking-[0.4em] text-beige uppercase mb-4 block"
          >
            {t.about.tagline}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-serif text-white mb-4"
          >
            {t.about.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-beige/80 font-light italic text-lg md:text-xl max-w-xl mx-auto"
          >
            Bridging the gap between ancient Ayurvedic wisdom and modern holistic wellness.
          </motion.p>
        </div>
      </section>

      {/* Who We Are */}
      <section className="py-20 bg-white">
        <div className="max-w-[800px] mx-auto px-4 md:px-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-8">{t.about.whoWeAre}</h2>
            <div className="w-16 h-px bg-secondary mx-auto mb-8" />
            <p className="text-secondary leading-relaxed mb-6 text-lg font-light">
              {t.about.desc1}
            </p>
            <p className="text-secondary leading-relaxed text-lg font-light">
              {t.about.desc2}
            </p>
          </motion.div>
        </div>
      </section>



      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">{t.about.values}</h2>
            <div className="w-16 h-px bg-secondary mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center p-6 group"
              >
                <div className="w-16 h-16 rounded-full bg-beige flex items-center justify-center mb-6 group-hover:bg-secondary group-hover:text-white transition-all duration-500">
                  <f.icon className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-serif text-primary mb-3">{t.features[f.titleKey as keyof typeof t.features]}</h4>
                <p className="text-sm text-secondary font-light leading-relaxed">{t.features[f.descKey as keyof typeof t.features]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Massive Mission & Vision */}
      <section className="py-24 md:py-32 bg-primary text-beige overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 relative z-10">
          <div className="flex flex-col gap-24">
            {/* Vision */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto"
            >
              <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
                <Eye className="w-10 h-10" />
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase">{t.about.vision}</h2>
              <p className="text-2xl md:text-4xl lg:text-5xl font-light leading-snug md:leading-tight italic text-beige/90">
                "{t.about.visionDesc}"
              </p>
            </motion.div>

            <div className="w-full h-px bg-beige/10" />

            {/* Mission */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto"
            >
              <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
                <Target className="w-10 h-10" />
              </div>
              <h2 className="text-4xl md:text-6xl font-serif text-white tracking-widest uppercase">{t.about.mission}</h2>
              <p className="text-2xl md:text-4xl lg:text-5xl font-light leading-snug md:leading-tight italic text-beige/90">
                "{t.about.missionDesc}"
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-primary text-beige text-center">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-serif mb-6">{t.about.contact}</h2>
            <p className="text-beige/70 font-light mb-10 max-w-lg mx-auto">
              {t.about.contactDesc}
            </p>
            <a 
              href="https://wa.me/917845890485" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 md:px-10 py-4 bg-secondary text-white rounded-full font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-3 mx-auto group w-fit"
            >
              <MessageCircle className="w-5 h-5" />
              {t.about.contactBtn}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
