const createPinIcon = (isSelected: boolean, isPinMode: boolean = false) => new L.DivIcon({
  className: "custom-pin",
  html: `
    <div style="
      position: relative;
      width: ${isSelected ? '52px' : '44px'};
      height: ${isSelected ? '52px' : '44px'};
      display: flex;
      alignItems: center;
      justifyContent: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: ${isSelected ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.9))' : 'none'};
      transform: ${isSelected ? 'scale(1.1) translateY(-10px)' : 'none'};
      opacity: ${isPinMode && !isSelected ? '0.4' : '1'};
      pointer-events: ${isPinMode ? 'none' : 'auto'};
    ">
      <svg width="100%" height="100%" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- The Needle/Line -->
        <line x1="14" y1="14" x2="14" y2="26" stroke="#000000" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="14" y1="14" x2="14" y2="25" stroke="#ef4444" stroke-width="1.2" stroke-linecap="round"/>
        
        <!-- The Circular Head -->
        <circle cx="14" cy="9" r="8.5" fill="#ef4444" stroke="#000000" stroke-width="2"/>
        
        <!-- The Home Icon -->
        <g transform="translate(11, 6) scale(0.25)">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" stroke="#000000" stroke-width="5"/>
          <polyline points="9 22 9 12 15 12 15 22" fill="white" stroke="#000000" stroke-width="5"/>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white"/>
          <polyline points="9 22 9 12 15 12 15 22" fill="white"/>
        </g>
      </svg>
    </div>
  `,
  iconSize: isSelected ? [52, 52] : [44, 44],
  iconAnchor: isSelected ? [26, 52] : [22, 44],
});
