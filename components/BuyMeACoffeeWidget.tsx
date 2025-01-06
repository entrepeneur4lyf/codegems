// components/BuyMeACoffee.js
'use client';
import { useEffect } from 'react';

const BuyMeACoffeeWidget = ({
  id = "bebedi",
  description = "Support me on Buy me a coffee!",
  message = "",
  color = "#BD5FFF",
  position = "Right",
  xMargin = 18,
  yMargin = 18
}) => {
  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.setAttribute('src', 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js');
    script.setAttribute('data-id', id);
    script.setAttribute('data-description', description);
    script.setAttribute('data-message', message);
    script.setAttribute('data-color', color);
    script.setAttribute('data-position', position);
    script.setAttribute('data-x_margin', xMargin);
    script.setAttribute('data-y_margin', yMargin);
    
    // Add script to document
    document.body.appendChild(script);

    // Cleanup function to remove script when component unmounts
    return () => {
      document.body.removeChild(script);
      // Clean up any widgets that were created
      const widgets = document.querySelectorAll('.bmc-btn-container');
      widgets.forEach(widget => widget.remove());
    };
  }, [id, description, message, color, position, xMargin, yMargin]);

  return null; // This component doesn't render anything directly
};

export default BuyMeACoffeeWidget;
