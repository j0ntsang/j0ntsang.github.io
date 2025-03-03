import { useEffect } from "react";

const originalTitle = document.title;

const useTitleAnimation = (animationType) => {
  useEffect(() => {
    let spin = ["|", "/", "-", "\\"];
    let i = 0;
    let titleInterval;

    const spinTitle = () => {
      document.title = `${originalTitle} ${spin[i]}`;
      i = (i + 1) % spin.length;
      requestAnimationFrame(spinTitle);
    };

    const bounceTitle = () => {
      let progress = " ".repeat(i) + "=" + " ".repeat(10 - i);
      document.title = `${originalTitle} | [${progress}]`;
      i = (i + 1) % 11;
      requestAnimationFrame(bounceTitle);
    };

    const typeTitle = () => {
      let message = `${originalTitle}`;
      let index = 0;

      function type() {
        document.title = message.substring(0, index + 1);
        index++;

        if (index < message.length) {
          requestAnimationFrame(type);
        }
      }

      requestAnimationFrame(type);
    };

    const loadDots = () => {
      let loadingMessage = "Loading";
      let dotCount = 0;

      function dots() {
        let dots = ".".repeat(dotCount);
        document.title = `${originalTitle} | ${loadingMessage}${dots}`;
        dotCount = (dotCount + 1) % 4;
        requestAnimationFrame(dots);
      }

      requestAnimationFrame(dots);
    };

    const flashTitle = () => {
      let originalTitle = document.title;
      let flashMessage = "New Notification!";
      let isFlashing = false;

      function flash() {
        document.title = isFlashing ? flashMessage : originalTitle;
        isFlashing = !isFlashing;
        requestAnimationFrame(flash);
      }

      requestAnimationFrame(flash);
    };

    const progressBarTitle = () => {
      let progress = 0;
      let total = 100;

      function progressAnimation() {
        if (progress <= total) {
          let percentage = Math.min(progress, 100);
          let totalWidth = 10;

          let completed = Math.floor((percentage / 100) * totalWidth);
          let remaining = percentage < total ? totalWidth - completed : 0;

          let progressChar = "\u2591";
          let remainingChar = "\u2592";
          let percentageChar = percentage < total ? `${percentage}%` : "\u2713";
          let progressLoaded = progressChar.repeat(completed);
          let remainingSpace = remainingChar.repeat(remaining);
          let progressBar = `${progressLoaded}${remainingSpace} ${percentageChar}`;
          document.title = `${progressBar}`;
          progress++;

          requestAnimationFrame(progressAnimation);
        } else {
          setTimeout(() => {
            document.title = originalTitle;
          }, 500);
        }
      }

      requestAnimationFrame(progressAnimation);
    };

    switch (animationType) {
      case "spin":
        spinTitle();
        break;
      case "bounce":
        bounceTitle();
        break;
      case "typing":
        typeTitle();
        break;
      case "dots":
        loadDots();
        break;
      case "flash":
        flashTitle();
        break;
      case "progress":
        progressBarTitle();
        break;
      default:
        break;
    }

    return () => {
      cancelAnimationFrame(titleInterval);
    };
  }, [animationType]);
};

export default useTitleAnimation;
