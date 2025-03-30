import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        background: "rgba(0, 0, 0, 0.5)",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "8px",
        textAlign: "center",
      }}
    >
      <h1>Obstacle Outrun</h1>
      <p>Please use left, right, up and down arrows to avoid collisions</p>
      <GameCanvas />
    </div>
  );
}

export default App;