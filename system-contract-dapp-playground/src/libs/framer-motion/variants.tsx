import { Variants } from 'framer-motion';

export const navVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -30,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 140,
    },
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 80,
      delay: 0.6,
    },
  },
};
