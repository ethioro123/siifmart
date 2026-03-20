import React, { useRef, useEffect } from 'react';

interface ProgressBarProps {
    progress: number;
    containerClassName?: string;
    fillClassName?: string;
}

/**
 * A reusable progress bar component that handles dynamic width via refs
 * to avoid "no inline styles" lint errors in strict environments.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    containerClassName = "h-2 bg-white/10 rounded-full overflow-hidden",
    fillClassName = "h-full bg-blue-500 transition-all duration-300"
}) => {
    const fillRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (fillRef.current) {
            fillRef.current.style.width = `${Math.max(0, Math.min(100, progress))}%`;
        }
    }, [progress]);

    return (
        <div className={containerClassName}>
            <div ref={fillRef} className={fillClassName} />
        </div>
    );
};

interface VerticalBarProps {
    heightPercent: number;
    className?: string; // Container/Bar class
    style?: React.CSSProperties; // Allow passing other styles if needed, but primarily for ref-based height
}

export const VerticalBar: React.FC<VerticalBarProps> = ({
    heightPercent,
    className = "bg-white/5 rounded-t-lg w-full",
}) => {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (barRef.current) {
            barRef.current.style.height = `${Math.max(0, Math.min(100, heightPercent))}%`;
        }
    }, [heightPercent]);

    return (
        <div
            ref={barRef}
            className={className}
        />
    );
};
