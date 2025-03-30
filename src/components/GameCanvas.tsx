import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

const GameCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  // Refs to hold mutable values inside the animation loop
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const gameOverRef = useRef(false);

  useEffect(() => {
    // Set up scene, camera, and renderer with fixed dimensions
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    const camera = new THREE.PerspectiveCamera(
      75,
      GAME_WIDTH / GAME_HEIGHT,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(GAME_WIDTH, GAME_HEIGHT);
    if (mountRef.current) {
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);
    }

    // Create the player cube
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    // Array to hold falling obstacles
    const obstacles: THREE.Mesh[] = [];

    // Function to add a new obstacle
    const addObstacle = () => {
      const obstacleGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const obstacleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      
      // 30% chance to target near the player's current x position,
      // otherwise spawn at a random x between -3 and 3.
      let spawnX: number;
      if (Math.random() < 0.3) {
        spawnX = cube.position.x + (Math.random() * 0.6 - 0.3);
      } else {
        spawnX = Math.random() * 6 - 3;
      }
      obstacle.position.x = spawnX;
      obstacle.position.y = 4;
      scene.add(obstacle);
      obstacles.push(obstacle);
    };

    // Create obstacles at regular intervals (every 500ms)
    const obstacleInterval = setInterval(() => {
      if (!gameOverRef.current) addObstacle();
    }, 500);

    // Variables to control player movement
    let moveLeft = false;
    let moveRight = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLeft = true;
      if (e.key === "ArrowRight") moveRight = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") moveLeft = false;
      if (e.key === "ArrowRight") moveRight = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (gameOverRef.current) {
        renderer.render(scene, camera);
        return;
      }

      // Move player cube based on key input while staying within bounds
      if (moveLeft && cube.position.x > -3.5) cube.position.x -= 0.15;
      if (moveRight && cube.position.x < 3.5) cube.position.x += 0.15;

      // Update obstacles: move them down the screen (increased speed: 0.2 units per frame)
      obstacles.forEach((obs, index) => {
        obs.position.y -= 0.2;

        // Remove obstacle if it goes off-screen
        if (obs.position.y < -4) {
          scene.remove(obs);
          obstacles.splice(index, 1);
          scoreRef.current += 1;
        }
      });

      // Check for collisions using bounding boxes
      const cubeBox = new THREE.Box3().setFromObject(cube);
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        const obsBox = new THREE.Box3().setFromObject(obs);
        if (cubeBox.intersectsBox(obsBox)) {
          // Remove the colliding obstacle
          scene.remove(obs);
          obstacles.splice(i, 1);

          // Decrement lives
          livesRef.current -= 1;
          setLives(livesRef.current);

          // If lives drop to 0, trigger game over
          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            cancelAnimationFrame(animationId);
            break;
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Update score state every 200ms
    const scoreInterval = setInterval(() => {
      setScore(Math.floor(scoreRef.current));
    }, 200);

    // Clean up resources on component unmount
    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(obstacleInterval);
      clearInterval(scoreInterval);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Restart the game by reloading the page (or reset state as needed)
  const handleRestart = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        margin: "20px auto",
        position: "relative",
        border: "2px solid #555",
      }}
    >
      <div ref={mountRef} />
      {/* UI Overlay */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          color: "#fff",
          fontSize: "20px",
          fontFamily: "Arial, sans-serif",
          zIndex: 1,
        }}
      >
        Score: {score} | Lives: {lives}
      </div>
      {gameOver && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2,
            color: "#fff",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h1>Game Over</h1>
          <p>Your final score: {score}</p>
          <button onClick={handleRestart} style={{ padding: "10px 20px", fontSize: "16px" }}>
            Restart
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
