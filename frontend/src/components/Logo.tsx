import { motion } from 'framer-motion';

export function Logo() {
  return (
    <motion.div 
      className="relative inline-flex items-center justify-center translate-x-3"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Soft background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                   w-[200%] h-[300%] bg-[var(--skelica-accent-soft)] blur-3xl opacity-30"
      />
      
      {/* Logo text */}
      <div className="relative">
        <motion.h1 
          className="text-5xl md:text-6xl font-bold tracking-tight relative"
          style={{ 
            fontFamily: 'var(--font-display)',
            color: 'var(--fg-primary)',
          }}
        >
          {/* Main text with animated glow */}
          <motion.span
            className="relative inline-block"
            animate={{
              textShadow: [
                '0 0 20px rgba(135, 206, 235, 0.3), 0 0 40px rgba(135, 206, 235, 0.2)',
                '0 0 30px rgba(135, 206, 235, 0.5), 0 0 60px rgba(135, 206, 235, 0.3)',
                '0 0 20px rgba(135, 206, 235, 0.3), 0 0 40px rgba(135, 206, 235, 0.2)',
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            skelica
          </motion.span>
          
          {/* Subtle glitch effect - very occasional */}
          <motion.span
            className="absolute inset-0 text-[var(--skelica-accent)] opacity-0"
            animate={{
              opacity: [0, 0, 0.6, 0, 0, 0, 0.4, 0],
              x: [0, 0, 2, 0, 0, 0, -1, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              times: [0, 0.92, 0.93, 0.94, 0.96, 0.97, 0.98, 1],
            }}
            aria-hidden="true"
            style={{
              textShadow: '0 0 20px var(--skelica-accent)'
            }}
          >
            skelica
          </motion.span>
        </motion.h1>
      </div>

      {/* Decorative element - skeletal */}
      <motion.div
        className="absolute -right-6 top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-5 h-5"
          style={{ 
            filter: 'drop-shadow(0 0 8px var(--skelica-accent))'
          }}
        >
          <motion.path
            d="M12 2L12 22M6 6L12 12L18 6M6 18L12 12L18 18"
            stroke="var(--skelica-accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
