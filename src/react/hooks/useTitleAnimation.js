import { useEffect, useRef } from "react";

const totalPercent = 100;
const totalWidth = 15;
const checkmarkChar = "\u2713";

const framesMap = {
  spinner_line: ["|", "/", "-", "\\"],
  spinner_circle: ["◐", "◓", "◑", "◒"],
  ellipsis: [".", "..", "..."],
};

const renderAnimation = (type, progress) => {
  const frames = framesMap[type];
  return frames[progress % frames.length];
};

function useTitleProgress(animationType = "spinner_circle") {
  const originalTitleRef = useRef(document.title);
  const rafIdRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const savedTitle = originalTitleRef.current;
    progressRef.current = 0;

    const getTitle = () => {
      const progress = progressRef.current;

      if (framesMap[animationType]) {
        return renderAnimation(animationType, progress);
      }

      if (animationType === "hash_dot") {
        const completed = Math.floor((progress / 100) * totalWidth);
        const remaining = totalWidth - completed;
        const dotChar = "∙";
        return `[${"#".repeat(completed)}${dotChar.repeat(remaining)}] ${
          progress < 100 ? `${progress}%` : checkmarkChar
        }`;
      }

      return `${progress}% Loaded`;
    };

    const animate = () => {
      if (progressRef.current <= totalPercent) {
        document.title = getTitle();
        progressRef.current += 1;
        rafIdRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          document.title = savedTitle;
        }, 150);
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      document.title = savedTitle;
    };
  }, [animationType]);
}

export default useTitleProgress;
