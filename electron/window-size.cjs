function fitWindowToWorkArea(defaults, workArea) {
  return {
    width: Math.min(defaults.width, workArea.width),
    height: Math.min(defaults.height, workArea.height),
    minWidth: Math.min(defaults.minWidth, workArea.width),
    minHeight: Math.min(defaults.minHeight, workArea.height),
  };
}

module.exports = { fitWindowToWorkArea };
