'use client';

import {
  Variants,
  Target,
  VariantLabels,
  TargetAndTransition,
  AnimationControls,
  motion,
} from 'framer-motion';
import { ReactNode, HTMLAttributeAnchorTarget } from 'react';

/**
 * @notice Since components from framer-motion library only run on the client-side,
 *        this module facilitates wrapping these components in a client-side component,
 *        enabling their usage within server-side components.
 */

interface PageProps {
  src?: string;
  alt?: string;
  href?: string;
  title?: string;
  viewport?: any;
  transition?: any;
  className?: string;
  width?: number;
  height?: number;
  variants?: Variants;
  elementType?: string;
  children?: ReactNode;
  inLine?: boolean;
  target?: HTMLAttributeAnchorTarget | undefined;
  initial?: boolean | Target | VariantLabels;
  whileHover?: VariantLabels | TargetAndTransition;
  whileInView?: VariantLabels | TargetAndTransition;
  animate?: AnimationControls | TargetAndTransition | VariantLabels | boolean;
}

export const HmotionSection = (props: PageProps) => {
  return (
    <motion.section
      initial={props.initial}
      whileInView={props.whileInView}
      variants={props.variants}
      viewport={props.viewport}
      className={props.className}
    >
      {props.children}
    </motion.section>
  );
};

export const HmotionNav = (props: PageProps) => {
  return (
    <motion.nav
      initial={props.initial}
      whileInView={props.whileInView}
      variants={props.variants}
      className={props.className}
    >
      {props.children}
    </motion.nav>
  );
};

export const HmotionDiv = (props: PageProps) => {
  return (
    <motion.div
      initial={props.initial}
      whileInView={props.whileInView}
      variants={props.variants}
      viewport={props.viewport}
      transition={props.transition}
      className={props.className}
    >
      {props.children}
    </motion.div>
  );
};

export const HmotionSpan = (props: PageProps) => {
  return (
    <motion.span
      initial={props.initial}
      whileInView={props.whileInView}
      variants={props.variants}
      viewport={props.viewport}
      className={props.className}
    >
      {props.children}
    </motion.span>
  );
};

export const HmotionP = (props: PageProps) => {
  return (
    <motion.p
      initial={props.initial}
      whileInView={props.whileInView}
      variants={props.variants}
      viewport={props.viewport}
      className={props.className}
    >
      {props.children}
    </motion.p>
  );
};

export const HmotionH1 = (props: PageProps) => {
  return (
    <motion.h1
      initial={props.initial}
      whileInView={props.whileInView}
      variants={props.variants}
      viewport={props.viewport}
      className={props.className}
    >
      {props.children}
    </motion.h1>
  );
};
