if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/logue/sw.js").then((reg) => {
    console.log("SW registered.", reg);
  });
}
