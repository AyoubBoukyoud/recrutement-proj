'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// We wrap the Next.js Link with framer-motion to get animations on links too
const MotionLink = motion(Link);

export function AnimatedLink({ children, className, href, ...props }: React.ComponentProps<typeof MotionLink>) {
  return (
    <MotionLink
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`transition-colors ${className || ''}`}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
