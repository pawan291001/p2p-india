import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  duration?: number;
  as?: keyof JSX.IntrinsicElements;
}

const directionMap = {
  up: "translateY(18px)",
  left: "translateX(-18px)",
  right: "translateX(18px)",
  none: "translateY(0)",
};

const ScrollReveal = ({
  children,
  className = "",
  delay = 0,
  direction = "up",
  duration = 600,
  as: Tag = "div",
}: RevealProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style: CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translate(0) scale(1)" : `${directionMap[direction]} scale(0.98)`,
    filter: visible ? "blur(0px)" : "blur(4px)",
    transition: `opacity ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    willChange: "opacity, transform, filter",
  };

  return (
    // @ts-ignore - dynamic tag
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  );
};

export default ScrollReveal;
