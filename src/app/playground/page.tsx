"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { portfolioData } from "../data";
import { playSynthClick, initAudioEngine } from "../utils/sound";

// Terminal Line Type
interface TerminalLine {
  text: string;
  type: "input" | "system" | "success" | "error" | "output";
}

// Typo Game Prompt
interface RefactorPrompt {
  broken: string;
  fixed: string;
  description: string;
}

const REFACTOR_PROMPTS: RefactorPrompt[] = [
  { broken: "for (let i = 0; i < len i++)", fixed: "for (let i = 0; i < len; i++)", description: "Missing semicolon in loop statement" },
  { broken: "const [val, setVal] = useState(\"\"", fixed: "const [val, setVal] = useState(\"\");", description: "Unclosed useState hooks parentheses & brackets" },
  { broken: "import React from react", fixed: "import React from \"react\";", description: "Missing quotes for package string literal imports" },
  { broken: "if (err) throw err", fixed: "if (err) throw err;", description: "Missing terminal statement semicolon" },
  { broken: "return ( <div>hello )", fixed: "return ( <div>hello</div> );", description: "Unterminated HTML JSX tags in return statement" },
  { broken: "console.log(val", fixed: "console.log(val);", description: "Unbalanced parentheses in print log trace" },
  { broken: "app.listen(3000, () =>", fixed: "app.listen(3000, () => {});", description: "Incomplete arrow callback bracket scopes" },
  { broken: "const user = { name: \"Alex\"", fixed: "const user = { name: \"Alex\" };", description: "Missing closing curly bracket brace in object declaration" }
];

interface HackQuestion {
  question: string;
  codeSnippet?: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanation: string;
}

const HACK_QUESTIONS: HackQuestion[] = [
  {
    question: "Analyze the variable hoisting behavior. What is printed to stdout?",
    codeSnippet: `var x = 10;
function test() {
  console.log(x);
  var x = 20;
}
test();`,
    options: [
      { key: "a", text: "10" },
      { key: "b", text: "20" },
      { key: "c", text: "undefined" },
      { key: "d", text: "ReferenceError" }
    ],
    correctKey: "c",
    explanation: "Inside test(), the local declaration 'var x' is hoisted to the top of the function scope, shadowing the outer 'x'. However, its initialization remains at the original line, so it prints undefined."
  },
  {
    question: "Identify the rendering behavior of this React component. What causes the issue?",
    codeSnippet: `function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => {
    setCount(count + 1);
    console.log(count);
  }}>Click</button>;
}`,
    options: [
      { key: "a", text: "setCount is synchronous and updates count instantly" },
      { key: "b", text: "setCount triggers infinite render loops" },
      { key: "c", text: "console.log prints the stale (previous) value due to closure" },
      { key: "d", text: "useState hook fails because of incorrect callback syntax" }
    ],
    correctKey: "c",
    explanation: "React state updates are asynchronous and batched. The variable 'count' inside the click handler closure holds the value from the current render cycle, meaning print logs reflect the old state value."
  },
  {
    question: "Examine the following CSS selectors. Which selector has the highest specificity rating?",
    codeSnippet: `/* specificity targets */
#sidebar .nav-item:hover { color: cyan; }
body main article p { color: gray; }
.nav-item { color: purple; }
#sidebar { color: white; }`,
    options: [
      { key: "a", text: "#sidebar" },
      { key: "b", text: "#sidebar .nav-item:hover" },
      { key: "c", text: "body main article p" },
      { key: "d", text: ".nav-item" }
    ],
    correctKey: "b",
    explanation: "#sidebar .nav-item:hover has 1 ID (sidebar), 1 class (nav-item) and 1 pseudo-class (hover), making its specificity rating [1, 2, 0], which is higher than the rest."
  },
  {
    question: "What is the primary role of the HTTP header 'Cache-Control: no-cache'?",
    options: [
      { key: "a", text: "Prevents any caching of the resource on browser or proxy servers" },
      { key: "b", text: "Forces client caches to validate the asset with the server before use" },
      { key: "c", text: "Directs web proxy servers to cache the file but bypasses browser cache" },
      { key: "d", text: "Deletes all cookies linked to the resource's parent directory" }
    ],
    correctKey: "b",
    explanation: "'no-cache' actually allows caches to store the response, but mandates that they submit a validation request (using ETag or Last-Modified) to the origin server before serving it."
  },
  {
    question: "Evaluate this JavaScript Promise chain. What is the output of the execution sequence?",
    codeSnippet: `Promise.resolve('A')
  .then(val => { console.log(val); return 'B'; })
  .then(val => { throw new Error('C'); })
  .catch(err => 'D')
  .then(val => console.log(val));`,
    options: [
      { key: "a", text: "Prints A, throws Error C and halts execution" },
      { key: "b", text: "Prints A, then prints D" },
      { key: "c", text: "Prints A, B, and D" },
      { key: "d", text: "Prints A, then prints C" }
    ],
    correctKey: "b",
    explanation: "The first then logs 'A' and returns 'B'. The second then throws Error('C'). The catch block intercepts this error and resolves with 'D', which is then passed to and logged by the final then."
  }
];

export default function Playground() {
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const snakeCanvasRef = useRef<HTMLCanvasElement>(null);
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null);
  const blastCanvasRef = useRef<HTMLCanvasElement>(null);

  // Shell States
  const [history, setHistory] = useState<TerminalLine[]>([
    { text: "SYSTEM INTRUSION SUCCESSFUL...", type: "success" },
    { text: "WELCOME TO THE INTERACTIVE DEV TERMINAL v1.1.2", type: "system" },
    { text: "TYPE 'help' TO VIEW AVAILABLE COMMANDS AND MINIGAMES.", type: "output" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isMatrixActive, setIsMatrixActive] = useState(false);

  // Sound Engine Refs
  const isSoundEnabledRef = useRef(isSoundEnabled);
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Speed Mode Settings: slow (160ms), normal (105ms), turbo (70ms)
  const [gameSpeed, setGameSpeed] = useState<"slow" | "normal" | "turbo">("normal");
  const gameSpeedRef = useRef(gameSpeed);
  useEffect(() => {
    gameSpeedRef.current = gameSpeed;
  }, [gameSpeed]);

  // Mini-Games Core Toggles
  const [isPlayingSnake, setIsPlayingSnake] = useState(false);
  const [isPlayingRefactor, setIsPlayingRefactor] = useState(false);
  const [isPlayingHack, setIsPlayingHack] = useState(false);
  const [isPlayingBlast, setIsPlayingBlast] = useState(false);

  // High Scores
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeHighScore, setSnakeHighScore] = useState(0);
  const [refactorScore, setRefactorScore] = useState(0);
  const [refactorHighScore, setRefactorHighScore] = useState(0);
  const [hackScore, setHackScore] = useState(0);
  const [hackHighScore, setHackHighScore] = useState(0);
  const [blastScore, setBlastScore] = useState(0);
  const [blastHighScore, setBlastHighScore] = useState(0);

  // Hack Game States
  const [hackLevel, setHackLevel] = useState(0);
  const [hackExplanation, setHackExplanation] = useState<string | null>(null);
  const [hackResultStatus, setHackResultStatus] = useState<"correct" | "incorrect" | null>(null);

  // Refactor Game States
  const [currentPrompt, setCurrentPrompt] = useState<RefactorPrompt | null>(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Snake Game variables
  const snakeGameRef = useRef<{
    snake: { x: number; y: number }[];
    direction: { x: number; y: number };
    nextDirection: { x: number; y: number };
    bug: { x: number; y: number };
    gridSize: number;
    tileCount: number;
    gameInterval: NodeJS.Timeout | null;
  }>({
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    bug: { x: 5, y: 5 },
    gridSize: 20,
    tileCount: 20,
    gameInterval: null,
  });

  // Bug Blaster Game variables
  const blastGameRef = useRef<{
    playerX: number;
    lasers: { x: number; y: number }[];
    bugs: { x: number; y: number; vx: number }[];
    gameInterval: NodeJS.Timeout | null;
  }>({
    playerX: 200,
    lasers: [],
    bugs: [],
    gameInterval: null,
  });

  // Check override parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("override") === "true") {
        setIsMatrixActive(true);
        setHistory(prev => [
          ...prev,
          { text: "\n[WARNING] SECURITY OVERRIDE TRIGGERED VIA SHELL BYPASS KEY.", type: "error" },
          { text: "CORE SYSTEMS LOCKING DOWN. DECRYPT CORE SECURITY DIRECTORY.", type: "system" },
          { text: "TYPE 'hack' TO ATTEMPT BYPASS AND RECOVERY OF CLASSIFIED SYSTEM LOGS.", type: "success" }
        ]);
      }
    }
  }, []);

  // Focus terminal input on load or game toggle
  useEffect(() => {
    if (!isPlayingSnake && !isPlayingRefactor && !isPlayingHack && !isPlayingBlast) {
      inputRef.current?.focus();
    }
  }, [isPlayingSnake, isPlayingRefactor, isPlayingHack, isPlayingBlast]);

  // Auto-scroll terminal text history
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  // Matrix Digital Rain
  useEffect(() => {
    if (!isMatrixActive) return;

    const canvas = matrixCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const codeSymbols = "0101<>{}[]()=>;?&&||!==++--".split("");
    const fontSize = 14;
    const columns = canvas.width / fontSize;

    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = 1;
    }

    let animationFrameId: number;

    const drawMatrix = () => {
      ctx.fillStyle = "rgba(3, 7, 18, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#10b981"; // green accent
      ctx.font = fontSize + "px monospace";

      for (let i = 0; i < rainDrops.length; i++) {
        const text = codeSymbols[Math.floor(Math.random() * codeSymbols.length)];
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.985) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
      animationFrameId = requestAnimationFrame(drawMatrix);
    };

    animationFrameId = requestAnimationFrame(drawMatrix);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMatrixActive]);

  // --- MINIGAME 1: GIT COMMIT SNAKE (REFACTOR SIMULATOR) ---
  const startSnakeGame = () => {
    setIsPlayingSnake(true);
    setSnakeScore(0);
    
    const game = snakeGameRef.current;
    game.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    game.direction = { x: 1, y: 0 };
    game.nextDirection = { x: 1, y: 0 };
    spawnBug();

    let speedMs = 100;
    if (gameSpeedRef.current === "slow") speedMs = 260;
    if (gameSpeedRef.current === "turbo") speedMs = 70;

    if (game.gameInterval) clearInterval(game.gameInterval);
    game.gameInterval = setInterval(gameLoop, speedMs);
  };

  const stopSnakeGame = () => {
    const game = snakeGameRef.current;
    if (game.gameInterval) {
      clearInterval(game.gameInterval);
      game.gameInterval = null;
    }
    setIsPlayingSnake(false);
    inputRef.current?.focus();
  };

  const spawnBug = () => {
    const game = snakeGameRef.current;
    let newX = Math.floor(Math.random() * game.tileCount);
    let newY = Math.floor(Math.random() * game.tileCount);
    
    const onSnake = game.snake.some(segment => segment.x === newX && segment.y === newY);
    if (onSnake) {
      spawnBug();
    } else {
      game.bug = { x: newX, y: newY };
    }
  };

  // Git-themed commit messages on bug resolution
  const commitMessages = [
    "Fixed memory leak in connection buffer",
    "Resolved CSS flex alignment mismatch",
    "Merged secure auth verification logic",
    "Fixed SQL index latency query bug",
    "Patched cross-site scripts injections",
    "Optimized file reader cache indexing"
  ];

  const gameLoop = () => {
    const game = snakeGameRef.current;
    const canvas = snakeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    game.direction = game.nextDirection;

    const head = {
      x: game.snake[0].x + game.direction.x,
      y: game.snake[0].y + game.direction.y
    };

    // Border Collision
    if (head.x < 0 || head.x >= game.tileCount || head.y < 0 || head.y >= game.tileCount) {
      snakeGameOver("MERGE CONFLICT: HEAD COLLIDED WITH REPO BRANCH BOUNDARY.");
      return;
    }

    // Body Collision
    const selfCollision = game.snake.some(segment => segment.x === head.x && segment.y === head.y);
    if (selfCollision) {
      snakeGameOver("SEGMENTATION FAULT: POINTER COLLIDED WITH EXPIRED STACK ADDRESS.");
      return;
    }

    game.snake.unshift(head);

    // Eaten bug logic
    if (head.x === game.bug.x && head.y === game.bug.y) {
      if (isSoundEnabledRef.current) playSynthClick("beep");
      
      setSnakeScore(prev => {
        const newScore = prev + 10;
        if (newScore > snakeHighScore) setSnakeHighScore(newScore);
        
        // Print interactive commit logs inside console history
        const randomMsg = commitMessages[Math.floor(Math.random() * commitMessages.length)];
        const hash = Math.random().toString(16).substring(2, 8);
        setHistory(h => [...h, { text: `[git commit -m "${hash}: ${randomMsg}"] (+10pts)`, type: "success" }]);
        
        return newScore;
      });
      spawnBug();
    } else {
      game.snake.pop();
    }

    // Drawing Canvas
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Lines (subtle dev grid)
    ctx.strokeStyle = "rgba(16, 185, 129, 0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < game.tileCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * game.gridSize, 0);
      ctx.lineTo(i * game.gridSize, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * game.gridSize);
      ctx.lineTo(canvas.width, i * game.gridSize);
      ctx.stroke();
    }

    // Draw Snake (Neon Code commits)
    game.snake.forEach((segment, idx) => {
      ctx.fillStyle = idx === 0 ? "var(--accent-teal)" : "var(--accent-violet)";
      ctx.fillRect(
        segment.x * game.gridSize + 1,
        segment.y * game.gridSize + 1,
        game.gridSize - 2,
        game.gridSize - 2
      );
      
      // Neon head borders
      if (idx === 0) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(
          segment.x * game.gridSize + 1,
          segment.y * game.gridSize + 1,
          game.gridSize - 2,
          game.gridSize - 2
        );
      }
    });

    // Draw Bug (Compiler Error Warning 🐛)
    ctx.fillStyle = "#ef4444";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ef4444";
    ctx.beginPath();
    ctx.arc(
      game.bug.x * game.gridSize + game.gridSize / 2,
      game.bug.y * game.gridSize + game.gridSize / 2,
      game.gridSize / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const snakeGameOver = (errorMsg: string) => {
    stopSnakeGame();
    if (isSoundEnabledRef.current) {
      playSynthClick("keypress");
      setTimeout(() => playSynthClick("keypress"), 70);
      setTimeout(() => playSynthClick("keypress"), 140);
    }
    setHistory(prev => [
      ...prev,
      { text: `[FATAL] ${errorMsg}`, type: "error" },
      { text: `COMPILER PIPELINE CRASHED. SCORE: ${snakeScore} PTS.`, type: "error" },
      { text: "TYPE 'play' TO REBUILD AND RUN OR 'help' FOR UTILITIES.", type: "output" }
    ]);
  };

  // Keyboard navigation hook for Snake
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingSnake) return;

      const game = snakeGameRef.current;
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (game.direction.y !== 1) {
            game.nextDirection = { x: 0, y: -1 };
            if (isSoundEnabledRef.current) playSynthClick("hover");
          }
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (game.direction.y !== -1) {
            game.nextDirection = { x: 0, y: 1 };
            if (isSoundEnabledRef.current) playSynthClick("hover");
          }
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (game.direction.x !== 1) {
            game.nextDirection = { x: -1, y: 0 };
            if (isSoundEnabledRef.current) playSynthClick("hover");
          }
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (game.direction.x !== -1) {
            game.nextDirection = { x: 1, y: 0 };
            if (isSoundEnabledRef.current) playSynthClick("hover");
          }
          e.preventDefault();
          break;
        case "Escape":
          stopSnakeGame();
          setHistory(prev => [...prev, { text: "GAME EXECUTION INTERRUPTED.", type: "system" }]);
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlayingSnake, isSoundEnabled]);

  // Keyboard hook for Refactor Game ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRefactor) return;
      if (e.key === "Escape") {
        stopRefactorGame();
        setHistory(prev => [...prev, { text: "REFACTOR UTILITY DISCONNECTED.", type: "system" }]);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlayingRefactor]);

  // --- MINIGAME 2: CODE REFACTOR (SPEED TYPING CONFLICT RESOLUTION) ---
  const startRefactorGame = () => {
    setIsPlayingRefactor(true);
    setRefactorScore(0);
    triggerNextRefactorPrompt(0);
  };

  const stopRefactorGame = () => {
    setIsPlayingRefactor(false);
    setCurrentPrompt(null);
    if (timerRef.current) clearInterval(timerRef.current);
    inputRef.current?.focus();
  };

  const triggerNextRefactorPrompt = (currentScore: number) => {
    const randomIdx = Math.floor(Math.random() * REFACTOR_PROMPTS.length);
    const selected = REFACTOR_PROMPTS[randomIdx];
    
    setCurrentPrompt(selected);
    setInputValue("");
    setTimeLeft(10); // 10 seconds to solve the typo

    setHistory(h => [
      ...h,
      { text: `\n[CONFLICT #${currentScore / 10 + 1}] TYPE: ${selected.description}`, type: "system" },
      { text: `BROKEN: ${selected.broken}`, type: "error" },
      { text: `FIX TARGET:`, type: "output" }
    ]);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          refactorGameOver(selected.fixed);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleRefactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPrompt) return;

    const userFix = inputValue.trim();
    if (userFix === currentPrompt.fixed) {
      if (isSoundEnabledRef.current) playSynthClick("beep");
      
      const newScore = refactorScore + 10;
      setRefactorScore(newScore);
      if (newScore > refactorHighScore) setRefactorHighScore(newScore);

      setHistory(h => [
        ...h,
        { text: `SUCCESS: Conflict successfully merged!`, type: "success" }
      ]);
      
      triggerNextRefactorPrompt(newScore);
    } else {
      if (isSoundEnabledRef.current) playSynthClick("keypress");
      setHistory(h => [
        ...h,
        { text: `ERROR: Fix syntax incorrect. Expected: "${currentPrompt.fixed}"`, type: "error" }
      ]);
      setInputValue("");
    }
  };

  const refactorGameOver = (expected: string) => {
    stopRefactorGame();
    if (isSoundEnabledRef.current) {
      playSynthClick("keypress");
      setTimeout(() => playSynthClick("keypress"), 70);
      setTimeout(() => playSynthClick("keypress"), 140);
    }
    setHistory(h => [
      ...h,
      { text: `[FATAL] PIPELINE TIMEOUT EXPIRED. Expected: "${expected}"`, type: "error" },
      { text: `REFACTOR RUN FAILED. SCORE: ${refactorScore} PTS.`, type: "error" },
      { text: "TYPE 'refactor' TO BUILD AND RUN OR 'help' FOR OTHER ACTIONS.", type: "output" }
    ]);
  };

  // Keyboard hook for Hack Game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingHack) return;

      const key = e.key.toLowerCase();

      if (key === "escape") {
        stopHackGame();
        setHistory(prev => [...prev, { text: "HACK UTILITY TERMINATED BY INTRUDER.", type: "system" }]);
        e.preventDefault();
        return;
      }

      if (hackResultStatus !== null) {
        if (e.key === "Enter") {
          advanceHackLevel();
          e.preventDefault();
        }
        return;
      }

      if (["a", "b", "c", "d"].includes(key)) {
        submitHackAnswer(key);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlayingHack, hackLevel, hackResultStatus, hackScore, hackHighScore, isSoundEnabled]);

  // --- MINIGAME 3: HACK THE FIREWALL (MULTIPLE CHOICE DEBUGGING) ---
  const startHackGame = () => {
    setIsPlayingHack(true);
    setHackLevel(0);
    setHackScore(0);
    setHackExplanation(null);
    setHackResultStatus(null);
  };

  const stopHackGame = () => {
    setIsPlayingHack(false);
    setHackExplanation(null);
    setHackResultStatus(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const submitHackAnswer = (selectedKey: string) => {
    if (hackResultStatus !== null) return;

    const currentQ = HACK_QUESTIONS[hackLevel];
    const isCorrect = selectedKey.toLowerCase() === currentQ.correctKey;

    if (isCorrect) {
      if (isSoundEnabledRef.current) playSynthClick("chime");
      setHackResultStatus("correct");
      setHackScore(prev => {
        const newScore = prev + 10;
        if (newScore > hackHighScore) setHackHighScore(newScore);
        return newScore;
      });
      setHackExplanation(`[SUCCESS] HUB SECURITY COMPROMISED! ${currentQ.explanation}`);
    } else {
      if (isSoundEnabledRef.current) playSynthClick("error");
      setHackResultStatus("incorrect");
      setHackExplanation(`[ACCESS DENIED] SIGNATURE MISMATCH! ${currentQ.explanation}`);
    }
  };

  const advanceHackLevel = () => {
    const nextLevel = hackLevel + 1;
    setHackExplanation(null);
    setHackResultStatus(null);

    // Run 3 questions
    if (nextLevel < 3 && nextLevel < HACK_QUESTIONS.length) {
      setHackLevel(nextLevel);
    } else {
      hackGameOver(true);
    }
  };

  const hackGameOver = (success: boolean) => {
    const finalScore = hackScore;
    stopHackGame();
    if (success) {
      if (isSoundEnabledRef.current) {
        playSynthClick("chime");
        setTimeout(() => playSynthClick("chime"), 150);
      }
      setHistory(h => [
        ...h,
        { text: "\n[SUCCESS] FIREWALL BYPASSED. SYSTEM ENCRYPTED DIRECTORY REVEALED:", type: "success" },
        { text: "==============================================", type: "success" },
        { text: "» RETRIEVED SEC_LOG_01: Working on quantum database indexes at TechSphere...", type: "system" },
        { text: "» RETRIEVED SEC_LOG_02: Secret project 'Aether' uses Next.js app routes with zero-bundler modules...", type: "system" },
        { text: "» RETRIEVED SEC_LOG_03: Special Easter Egg complete. Nice work, Operator.", type: "success" },
        { text: "==============================================", type: "success" },
        { text: `TOTAL BYPASS SCORE: ${finalScore} PTS. TYPE 'help' FOR OTHER ACTIONS.`, type: "success" }
      ]);
    } else {
      if (isSoundEnabledRef.current) playSynthClick("error");
      setHistory(h => [
        ...h,
        { text: "\n[FATAL] DECRYPTION RUN CRITICAL FAIL. SYSTEM COLD LOCKDOWN ENGAGED.", type: "error" },
        { text: "TYPE 'hack' TO RESET SECURITY INTRUSION PIPELINE.", type: "output" }
      ]);
    }
  };

  // Keyboard hook for Bug Blaster Game controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingBlast) return;

      const game = blastGameRef.current;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          game.playerX = Math.max(15, game.playerX - 18);
          if (isSoundEnabledRef.current) playSynthClick("hover");
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          game.playerX = Math.min(385, game.playerX + 18);
          if (isSoundEnabledRef.current) playSynthClick("hover");
          e.preventDefault();
          break;
        case " ":
          // Shoot laser
          if (game.lasers.length < 5) {
            game.lasers.push({ x: game.playerX, y: 370 });
            if (isSoundEnabledRef.current) playSynthClick("keypress");
          }
          e.preventDefault();
          break;
        case "Escape":
          stopBlastGame();
          setHistory(prev => [...prev, { text: "BUG BLAST SIMULATOR ABORTED.", type: "system" }]);
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlayingBlast, isSoundEnabled]);

  // --- MINIGAME 4: BUG BLASTER (SHOOTING GAME CABINET) ---
  const startBlastGame = () => {
    setIsPlayingBlast(true);
    setBlastScore(0);
    const game = blastGameRef.current;
    game.playerX = 200;
    game.lasers = [];
    game.bugs = [];
    
    if (game.gameInterval) clearInterval(game.gameInterval);
    game.gameInterval = setInterval(blastGameLoop, 30);
  };

  const stopBlastGame = () => {
    const game = blastGameRef.current;
    if (game.gameInterval) {
      clearInterval(game.gameInterval);
      game.gameInterval = null;
    }
    setIsPlayingBlast(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const blastGameLoop = () => {
    const game = blastGameRef.current;
    const canvas = blastCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Move lasers
    game.lasers = game.lasers.map(l => ({ ...l, y: l.y - 8 })).filter(l => l.y > 0);

    // Spawn bugs
    if (Math.random() < 0.05 && game.bugs.length < 8) {
      game.bugs.push({
        x: Math.random() * 360 + 20,
        y: 0,
        vx: (Math.random() - 0.5) * 2.5
      });
    }

    // Move bugs
    game.bugs = game.bugs.map(b => ({
      ...b,
      y: b.y + 2.5,
      x: Math.max(10, Math.min(390, b.x + b.vx))
    }));

    // Collision check
    let hitLasers: number[] = [];
    let hitBugs: number[] = [];

    game.lasers.forEach((l, li) => {
      game.bugs.forEach((b, bi) => {
        const dist = Math.hypot(l.x - b.x, l.y - b.y);
        if (dist < 15) {
          hitLasers.push(li);
          hitBugs.push(bi);
          if (isSoundEnabledRef.current) playSynthClick("beep");
          setBlastScore(prev => {
            const newScore = prev + 10;
            if (newScore > blastHighScore) setBlastHighScore(newScore);
            return newScore;
          });
        }
      });
    });

    game.lasers = game.lasers.filter((_, idx) => !hitLasers.includes(idx));
    game.bugs = game.bugs.filter((_, idx) => !hitBugs.includes(idx));

    // Check hit ship or bottom line
    const hitBottom = game.bugs.some(b => b.y >= 385);
    if (hitBottom) {
      blastGameOver("COMPILER PIPELINE INUNDATED WITH UNRESOLVED SYNTAX BUGS.");
      return;
    }

    // Render Canvas
    ctx.fillStyle = "#0c101d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = "rgba(16, 185, 129, 0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 20, 0);
      ctx.lineTo(i * 20, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * 20);
      ctx.lineTo(canvas.width, i * 20);
      ctx.stroke();
    }

    // Draw player ship
    ctx.fillStyle = "#10b981";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(game.playerX, 375);
    ctx.lineTo(game.playerX - 12, 392);
    ctx.lineTo(game.playerX + 12, 392);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw lasers
    ctx.fillStyle = "#22d3ee";
    ctx.shadowBlur = 6;
    ctx.shadowColor = "#22d3ee";
    game.lasers.forEach(l => {
      ctx.fillRect(l.x - 1.5, l.y - 10, 3, 10);
    });
    ctx.shadowBlur = 0;

    // Draw bugs
    ctx.fillStyle = "#ef4444";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#ef4444";
    game.bugs.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw antennae
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(b.x - 3, b.y - 7);
      ctx.lineTo(b.x - 6, b.y - 13);
      ctx.moveTo(b.x + 3, b.y - 7);
      ctx.lineTo(b.x + 6, b.y - 13);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  };

  const blastGameOver = (errorMsg: string) => {
    stopBlastGame();
    if (isSoundEnabledRef.current) {
      playSynthClick("error");
    }
    setHistory(prev => [
      ...prev,
      { text: `[FATAL] ${errorMsg}`, type: "error" },
      { text: `SYSTEM OVERFLOW DETECTED. FINAL SCORE: ${blastScore} PTS.`, type: "error" },
      { text: "TYPE 'blast' TO COMPILE AND RUN OR 'help' FOR OTHER ACTIONS.", type: "output" }
    ]);
  };

  // Commands interpreter
  const executeCommand = (command: string) => {
    switch (command) {
      case "help":
        setHistory(prev => [
          ...prev,
          { text: "AVAILABLE UTILITIES & UTILITY TARGETS:", type: "system" },
          { text: "  about    - Print developer technical summary", type: "output" },
          { text: "  skills   - Render core competencies ASCII chart", type: "output" },
          { text: "  play     - Launch keyboard-controlled retro 'Code-Snake' game", type: "output" },
          { text: "  refactor - Start coding typing game: Fix syntax typo compiler warnings", type: "output" },
          { text: "  hack     - Attempt firewall penetration: Solve engineering trivia decryptions", type: "output" },
          { text: "  blast    - Start 2D Bug Blaster: Shoot falling compiler syntax warnings", type: "output" },
          { text: "  matrix   - Toggle streaming digital rain background overlays", type: "output" },
          { text: "  clear    - Flush shell output buffers", type: "output" },
          { text: "  exit     - Close shell connection & return home", type: "output" },
        ]);
        break;
      case "about":
        setHistory(prev => [
          ...prev,
          { text: `DEVELOPER SUMMARY: ${portfolioData.personalInfo.name}`, type: "success" },
          { text: `ROLE: ${portfolioData.personalInfo.title}`, type: "system" },
          { text: `SUMMARY: ${portfolioData.personalInfo.subtitle}`, type: "output" },
          { text: `BIO: ${portfolioData.about[0]}`, type: "output" }
        ]);
        break;
      case "skills":
        setHistory(prev => [
          ...prev,
          { text: "ANALYZING SYSTEM DEPENDENCIES...", type: "system" },
          { text: "React/Next.js   [████████████████████] 100% - EXPERT", type: "success" },
          { text: "TypeScript       [██████████████████░░] 90%  - SENIOR", type: "success" },
          { text: "NodeJS/APIs      [████████████████░░░░] 80%  - ADVANCED", type: "success" },
          { text: "Web Access (WCAG)[████████████████░░░░] 80%  - ADVANCED", type: "success" },
          { text: "Docker/Devops    [████████████░░░░░░░░] 60%  - COMPETENT", type: "output" },
        ]);
        break;
      case "clear":
        setHistory([]);
        break;
      case "matrix":
        setIsMatrixActive(prev => {
          const next = !prev;
          setHistory(h => [
            ...h,
            { text: next ? "STREAMING MATRIX WATERFALL ACTIVE." : "MATRIX OVERLAYS DISMANTLED.", type: "success" }
          ]);
          return next;
        });
        break;
      case "play":
        setHistory(prev => [
          ...prev,
          { text: "COMPILING REFACTOR SIMULATION BUILD...", type: "success" },
          { text: "CONTROLS: ARROWS / WASD TO NAVIGATE, ESC TO QUIT.", type: "system" },
          { text: "RESOLVE COMPILER BUG ERRORS (*) TO LOG GIT COMMITS.", type: "system" },
        ]);
        startSnakeGame();
        break;
      case "refactor":
        setHistory(prev => [
          ...prev,
          { text: "INITIALIZING MERGE CONFLICT RESOLVER PIPELINE...", type: "success" },
          { text: "RULES: TYPE THE FIXED VERSION OF THE CODE PROMPT BEFORE TIMER EXPIRES.", type: "system" },
          { text: "PRESS ESC TO ABANDON RUN.", type: "system" }
        ]);
        startRefactorGame();
        break;
      case "hack":
        setHistory(prev => [
          ...prev,
          { text: "ESTABLISHING SSH SECURE FIREWALL DECRYPTION TUNNEL...", type: "success" },
          { text: "RULES: SOLVE MULTIPLE CHOICE DECRYPTIONS TO GAIN ACCESS. CHOOSE KEY [A, B, C, D].", type: "system" },
          { text: "PRESS ESC TO ABORT SYSTEM PENETRATION.", type: "system" }
        ]);
        startHackGame();
        break;
      case "blast":
        setHistory(prev => [
          ...prev,
          { text: "LAUNCHING INTEGRATED RETRO ARCADE bug_blaster.bin...", type: "success" },
          { text: "CONTROLS: LEFT/RIGHT ARROWS / A/D TO MOVE, SPACEBAR TO SHOOT, ESC TO EXIT.", type: "system" },
          { text: "SHOOT RED WARNING BUGS BEFORE THEY COLLIDE WITH SYSTEM ENVIRONMENT.", type: "system" }
        ]);
        startBlastGame();
        break;
      case "exit":
        window.location.href = "/";
        break;
      default:
        setHistory(prev => [
          ...prev,
          { text: `shell: command not found: '${command}'. Type 'help' for options.`, type: "error" }
        ]);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputValue.trim().toLowerCase();
    setInputValue("");

    if (isSoundEnabledRef.current) {
      playSynthClick("beep");
    }

    if (!command) return;

    setHistory(prev => [...prev, { text: `rivera-dev@guest:~$ ${command}`, type: "input" }]);
    executeCommand(command);
  };

  const runQuickCommand = (cmd: string) => {
    setHistory(prev => [...prev, { text: `rivera-dev@guest:~$ ${cmd}`, type: "input" }]);
    executeCommand(cmd);
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", color: "#10b981", background: "#030712" }}>
      {/* Matrix Overlay Canvas */}
      {isMatrixActive && (
        <canvas
          ref={matrixCanvasRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 0,
            opacity: 0.25,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Main Container */}
      <div 
        style={{ 
          position: "relative", 
          zIndex: 1, 
          maxWidth: "900px", 
          margin: "0 auto", 
          padding: "48px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          minHeight: "100vh"
        }}
      >
        {/* Navigation Bar */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
            <h1 style={{ fontFamily: "monospace", fontSize: "1.125rem", fontWeight: "700", letterSpacing: "1px" }}>
              DEV_PLAYGROUND
            </h1>
          </div>
          <Link href="/" className="interactive-element" style={{ color: "#10b981", fontSize: "0.8rem", border: "1px solid #10b981", padding: "6px 16px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.05)", transition: "all 0.3s" }}>
            ← Return to Portfolio
          </Link>
        </header>

        {/* Terminal Window Box */}
        <div 
          style={{ 
            flexGrow: 1, 
            background: "rgba(12, 16, 29, 0.85)", 
            border: "1px solid rgba(16, 185, 129, 0.25)", 
            borderRadius: "8px", 
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(16, 185, 129, 0.05)",
            backdropFilter: "blur(15px)",
            WebkitBackdropFilter: "blur(15px)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            fontFamily: "monospace",
            fontSize: "0.9rem",
            lineHeight: "1.5"
          }}
          onClick={() => !isPlayingSnake && !isPlayingRefactor && inputRef.current?.focus()}
        >
          {/* Terminal Tab Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid rgba(16, 185, 129, 0.1)" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#fbbf24" }} />
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10b981" }} />
              <span style={{ color: "rgba(16, 185, 129, 0.4)", fontSize: "0.75rem", marginLeft: "12px" }}>
                bash - rivera-dev@guest:~/playground
              </span>
            </div>
            
            {/* Control Panel: SFX Toggle + Speed Mode */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {/* Speed Controller */}
              {!isPlayingRefactor && (
                <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem", alignItems: "center" }}>
                  <span style={{ color: "rgba(16, 185, 129, 0.4)" }}>SPEED:</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setGameSpeed("slow"); }}
                    style={{ background: "transparent", border: "none", color: gameSpeed === "slow" ? "#22d3ee" : "rgba(16, 185, 129, 0.3)", cursor: "pointer", fontFamily: "monospace" }}
                  >
                    SLOW
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setGameSpeed("normal"); }}
                    style={{ background: "transparent", border: "none", color: gameSpeed === "normal" ? "#22d3ee" : "rgba(16, 185, 129, 0.3)", cursor: "pointer", fontFamily: "monospace" }}
                  >
                    NORMAL
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setGameSpeed("turbo"); }}
                    style={{ background: "transparent", border: "none", color: gameSpeed === "turbo" ? "#22d3ee" : "rgba(16, 185, 129, 0.3)", cursor: "pointer", fontFamily: "monospace" }}
                  >
                    TURBO
                  </button>
                </div>
              )}

              {/* Sound Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSoundEnabled) {
                    initAudioEngine();
                    setIsSoundEnabled(true);
                  } else {
                    setIsSoundEnabled(false);
                  }
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isSoundEnabled ? "#10b981" : "rgba(16, 185, 129, 0.3)",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>[SFX: {isSoundEnabled ? "ON" : "OFF"}]</span>
              </button>
            </div>
          </div>

          {/* Regular Terminal Text History Output */}
          {!isPlayingSnake && !isPlayingRefactor && !isPlayingHack && (
            <div style={{ flexGrow: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              {history.map((line, idx) => {
                let color = "rgba(16, 185, 129, 0.85)";
                if (line.type === "success") color = "#34d399";
                if (line.type === "error") color = "#f87171";
                if (line.type === "system") color = "#60a5fa";
                
                return (
                  <div key={idx} style={{ color, whiteSpace: "pre-wrap" }}>
                    {line.text}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          )}

          {/* Snake Game Canvas Area */}
          {isPlayingSnake && (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "16px 0" }}>
              <div style={{ display: "flex", width: "100%", maxWidth: "400px", justifyContent: "space-between", color: "#60a5fa", fontSize: "0.85rem" }}>
                <span>COMMITS MERGED: {snakeScore / 10}</span>
                <span>HIGH SCORE: {snakeHighScore}</span>
                <span>ESC TO SHUTDOWN</span>
              </div>
              <canvas
                ref={snakeCanvasRef}
                width={400}
                height={400}
                style={{
                  border: "2px solid #22d3ee",
                  borderRadius: "4px",
                  boxShadow: "0 0 20px rgba(34, 211, 238, 0.2)",
                  background: "#0c101d"
                }}
              />
            </div>
          )}

          {/* Refactor typing game screen */}
          {isPlayingRefactor && currentPrompt && (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#60a5fa", fontSize: "0.85rem" }}>
                <span>RESOLVED CONFLICTS: {refactorScore / 10}</span>
                <span>HIGH SCORE: {refactorHighScore}</span>
                <span style={{ color: timeLeft <= 3 ? "#ef4444" : "#60a5fa" }}>TIMEOUT IN: {timeLeft}s</span>
              </div>
              
              <div style={{ background: "rgba(3, 7, 18, 0.5)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", padding: "20px" }}>
                <p style={{ color: "rgba(16, 185, 129, 0.4)", fontSize: "0.75rem", marginBottom: "8px", textTransform: "uppercase" }}>
                  Broken Code Snippet
                </p>
                <code style={{ fontSize: "1.1rem", color: "#f87171", wordBreak: "break-all" }}>
                  {currentPrompt.broken}
                </code>
              </div>

              <form onSubmit={handleRefactorSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <label htmlFor="refactor-input" style={{ color: "rgba(16, 185, 129, 0.4)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                  Type Fixed Statement:
                </label>
                <input
                  id="refactor-input"
                  ref={(el) => { if (el) el.focus(); }}
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (isSoundEnabled) playSynthClick("keypress");
                  }}
                  style={{
                    background: "rgba(3, 7, 18, 0.7)",
                    border: "1px solid #10b981",
                    borderRadius: "6px",
                    outline: "none",
                    color: "#10b981",
                    fontFamily: "monospace",
                    fontSize: "1.1rem",
                    padding: "12px"
                  }}
                  autoComplete="off"
                />
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Press ESC key anytime to return to terminal console prompt.
                </span>
              </form>
            </div>
          )}

          {/* Hack Decryption Quiz game screen */}
          {isPlayingHack && HACK_QUESTIONS[hackLevel] && (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#60a5fa", fontSize: "0.85rem", borderBottom: "1px solid rgba(96, 165, 250, 0.2)", paddingBottom: "10px" }}>
                <span style={{ color: "#ef4444", fontWeight: "bold", animation: "pulse 1.5s infinite" }}>▲ SYSTEM INTRUSION // PORT: 8080</span>
                <span>HUB BYPASS SCORE: {hackScore}</span>
                <span>HIGH SCORE: {hackHighScore}</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ color: "rgba(16, 185, 129, 0.5)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                  Hub {hackLevel + 1} of 3 - Security Challenge
                </span>
                <p style={{ fontSize: "1rem", color: "#f3f4f6", fontWeight: "600", lineHeight: "1.4" }}>
                  {HACK_QUESTIONS[hackLevel].question}
                </p>
              </div>

              {HACK_QUESTIONS[hackLevel].codeSnippet && (
                <div style={{ background: "rgba(3, 7, 18, 0.6)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px", padding: "16px", overflowX: "auto" }}>
                  <code style={{ fontSize: "0.85rem", color: "#34d399", fontFamily: "monospace", whiteSpace: "pre" }}>
                    {HACK_QUESTIONS[hackLevel].codeSnippet}
                  </code>
                </div>
              )}

              {/* Option List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                {HACK_QUESTIONS[hackLevel].options.map((opt) => {
                  return (
                    <button
                      key={opt.key}
                      onClick={() => submitHackAnswer(opt.key)}
                      disabled={hackResultStatus !== null}
                      onMouseEnter={() => {
                        if (isSoundEnabled && hackResultStatus === null) playSynthClick("hover");
                      }}
                      className="interactive-element"
                      style={{
                        background: "rgba(17, 24, 39, 0.5)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        borderRadius: "6px",
                        padding: "12px 16px",
                        textAlign: "left",
                        color: hackResultStatus !== null ? (opt.key === HACK_QUESTIONS[hackLevel].correctKey ? "#34d399" : "rgba(16, 185, 129, 0.3)") : "#10b981",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        cursor: hackResultStatus !== null ? "default" : "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                        width: "100%"
                      }}
                    >
                      <span style={{ 
                        background: hackResultStatus !== null && opt.key === HACK_QUESTIONS[hackLevel].correctKey ? "#34d399" : "rgba(16, 185, 129, 0.1)",
                        color: hackResultStatus !== null && opt.key === HACK_QUESTIONS[hackLevel].correctKey ? "#030712" : "#10b981",
                        padding: "2px 8px", 
                        borderRadius: "4px",
                        fontWeight: "bold"
                      }}>
                        {opt.key.toUpperCase()}
                      </span>
                      <span>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Feedback Explanation Banner */}
              {hackResultStatus !== null && (
                <div style={{ 
                  background: hackResultStatus === "correct" ? "rgba(52, 211, 153, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: hackResultStatus === "correct" ? "1px solid #34d399" : "1px solid #ef4444",
                  borderRadius: "6px",
                  padding: "16px",
                  marginTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  animation: "fadeIn 0.2s ease"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ 
                      width: "8px", 
                      height: "8px", 
                      borderRadius: "50%", 
                      background: hackResultStatus === "correct" ? "#34d399" : "#ef4444",
                      boxShadow: hackResultStatus === "correct" ? "0 0 10px #34d399" : "0 0 10px #ef4444"
                    }} />
                    <span style={{ 
                      color: hackResultStatus === "correct" ? "#34d399" : "#ef4444",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                      textTransform: "uppercase"
                    }}>
                      {hackResultStatus === "correct" ? "ACCESS GRANTED // HUB COMPROMISED" : "ACCESS DENIED // SECURITY PROTOCOL ENGAGED"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                    {hackExplanation}
                  </p>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      Press [ENTER] key or click continue to advance
                    </span>
                    <button
                      onClick={advanceHackLevel}
                      className="interactive-element"
                      style={{
                        background: hackResultStatus === "correct" ? "rgba(52, 211, 153, 0.1)" : "rgba(239, 68, 68, 0.1)",
                        border: hackResultStatus === "correct" ? "1px solid #34d399" : "1px solid #ef4444",
                        color: hackResultStatus === "correct" ? "#34d399" : "#ef4444",
                        borderRadius: "4px",
                        padding: "6px 16px",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {hackLevel === 2 ? "Decrypt Archive" : "Continue"} →
                    </button>
                  </div>
                </div>
              )}

              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center", marginTop: "8px" }}>
                Press ESC key anytime to abort security override run.
              </span>
            </div>
          )}

          {/* Bug Blaster Game Canvas Area */}
          {isPlayingBlast && (
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "16px 0" }}>
              <div style={{ display: "flex", width: "100%", maxWidth: "400px", justifyContent: "space-between", color: "#60a5fa", fontSize: "0.85rem" }}>
                <span>BUGS ELIMINATED: {blastScore / 10}</span>
                <span>HIGH SCORE: {blastHighScore}</span>
                <span>ESC TO SHUTDOWN</span>
              </div>
              <canvas
                ref={blastCanvasRef}
                width={400}
                height={400}
                style={{
                  border: "2px solid #ef4444",
                  borderRadius: "4px",
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
                  background: "#0c101d"
                }}
              />
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center" }}>
                CONTROLS: ARROWS / WASD TO SLIDE, SPACEBAR TO LASER SHOOT.
              </span>
            </div>
          )}

          {/* Shell input prompt */}
          {!isPlayingSnake && !isPlayingRefactor && !isPlayingHack && !isPlayingBlast && (
            <form onSubmit={handleCommandSubmit} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "#34d399", fontWeight: "700" }}>rivera-dev@guest:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (isSoundEnabled) playSynthClick("keypress");
                }}
                style={{
                  flexGrow: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#10b981",
                  fontFamily: "monospace",
                  fontSize: "0.9rem"
                }}
                autoFocus
                autoComplete="off"
                aria-label="Terminal command input"
              />
            </form>
          )}

          {/* Quick Action Pill Buttons */}
          {!isPlayingSnake && !isPlayingRefactor && !isPlayingHack && !isPlayingBlast && (
            <div 
              style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "8px", 
                marginTop: "16px", 
                borderTop: "1px solid rgba(16, 185, 129, 0.1)", 
                paddingTop: "12px",
                alignItems: "center"
              }}
            >
              <span style={{ color: "rgba(16, 185, 129, 0.4)", fontSize: "0.75rem", fontFamily: "monospace", textTransform: "uppercase", marginRight: "4px" }}>
                Quick Utilities:
              </span>
              {["about", "skills", "play", "refactor", "hack", "blast", "matrix", "clear"].map((cmd) => (
                <button
                  key={cmd}
                  onClick={(e) => {
                    e.preventDefault();
                    if (isSoundEnabled) playSynthClick("beep");
                    runQuickCommand(cmd);
                  }}
                  className="interactive-element"
                  style={{
                    background: "rgba(16, 185, 129, 0.05)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                    borderRadius: "4px",
                    color: "#10b981",
                    fontSize: "0.75rem",
                    padding: "4px 10px",
                    fontFamily: "monospace",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={() => {
                    if (isSoundEnabled) playSynthClick("hover");
                  }}
                >
                  {cmd}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>
    </div>
  );
}
