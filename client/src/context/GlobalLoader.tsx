// GlobalLoader.tsx
const GlobalLoader = () => (
  <div style={{
    position: "fixed",
    top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, color: "#fff"
  }}>
    Loading...
  </div>
);

export default GlobalLoader;
