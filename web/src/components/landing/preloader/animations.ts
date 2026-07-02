import { Variants } from "framer-motion";

export const EASE_PREMIUM = [0.16, 1, 0.3, 1] as const;

export const FADE_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.5, ease: EASE_PREMIUM } },
  exit: { opacity: 0, transition: { duration: 0.4, ease: EASE_PREMIUM } }
};

export const CROSSFADE_VARIANTS: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_PREMIUM } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.25, ease: EASE_PREMIUM } }
};

export const ORB_FLOAT: Variants = {
  animate: {
    y: [-4, 4, -4],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
