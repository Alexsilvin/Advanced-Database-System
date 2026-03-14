import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function CursorGlow() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const smoothX = useSpring(mouseX, { damping: 50, stiffness: 400 });
    const smoothY = useSpring(mouseY, { damping: 50, stiffness: 400 });

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            mouseX.set(e.clientX - 192); // center of 384px (w-96)
            mouseY.set(e.clientY - 192);
        };

        window.addEventListener('mousemove', updateMousePosition);

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
        };
    }, [mouseX, mouseY]);

    return (
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <motion.div
                className="absolute top-0 left-0 w-96 h-96 bg-neon-cyan/20 rounded-full blur-[120px]"
                style={{
                    x: smoothX,
                    y: smoothY,
                }}
            />
        </div>
    );
}
