import { useEffect } from "react";

const BuyMeACoffeeWidget = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.setAttribute("data-name", "BMC-Widget");
    script.setAttribute("data-cfasync", "false");
    script.setAttribute("src", "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js");
    script.setAttribute("data-id", "bebedi");
    script.setAttribute("data-description", "Support me on Buy me a coffee!");
    script.setAttribute("data-message", "");
    script.setAttribute("data-color", "#BD5FFF");
    script.setAttribute("data-position", "Right");
    script.setAttribute("data-x_margin", "18");
    script.setAttribute("data-y_margin", "18");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // This component doesn't render any visible JSX
};

export default BuyMeACoffeeWidget;
