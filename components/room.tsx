"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Chessboard } from "react-chessboard";
import { Chess, Square } from "chess.js"; // Piece is not used
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import GameAlert from "./gameAlert";
import { GAME_END_TYPE, GAME_STATE } from "@/lib/utils";
import { useRecoilState, useRecoilValue } from "recoil";
import socketAtom from "@/states/socketAtom";
import { useSocket } from "@/providers/socketProvider";

export default function ChessGameWithTimers({ id }: { id: string }) {
  const [game, setGame] = useState(new Chess());
  const [playerColor, setPlayerColor] = useState(""); // Track player color
  const [position, setPosition] = useState(game.fen()); // Initial position in FEN
  const { toast } = useToast(); // For showing notifications
  // @ts-ignore
  const socket:Socket = useSocket(); // Store socket instance
  const router = useRouter(); // For redirecting
  const [gameState, setGameState] = useState({
    blackTime: 600, // 10 minutes in seconds
    whiteTime: 600,
    state: GAME_STATE.NOTSTARTED,
  });
  const [alert, setAlert] = useState({
    open: false,
    type: GAME_END_TYPE.RESIGN,
  });

  const IP = "localhost";

  // Start timer for the game
  const startTimer = () => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        if (game.turn() === "b") {
          return { ...prev, blackTime: prev.blackTime - 1 };
        } else {
          return { ...prev, whiteTime: prev.whiteTime - 1 };
        }
      });
    }, 1000);
    return interval; // Return interval ID for cleanup
  };

  // Format the time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const leftSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${leftSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  //start the game
  const handleGameStart = () => {
    if (playerColor != game.turn()) {
      toast({
        title: `You cannot start the Game.`,
      });
      return;
    }
    setGameState((prev) => {
      return { ...prev, state: GAME_STATE.INPROGRESS };
    });
    socket?.emit("start-game", { gameId: id });
  };

  const handleResign = () => {
    //push to the home page
    socket?.emit("resign", { gameId: id, playerColor });
    router.push("/");
  };

  const handleDraw = () => {
    setGameState((prev) => {
      return { ...prev, state: GAME_STATE.HALTED };
    });
    socket?.emit("draw", { gameId: id, playerColor });
  };

  //main ws handler
  useEffect(() => {
    if (!socket) {
      return; // Return early if socket is not ready
    }
    console.log("Game starting with ID:", id);
    

    //make the user join the room
    socket?.emit("join-room", { gameID: id });

    //listen to the handshake event
    socket.on(
      "handshake-done",
      (data: { color: string; position: string }) => {
        setPlayerColor(data.color);
        console.log(data);
        game.load(data.position);
      }
    );

    //listen for position change
    socket.on(
      "position-change",
      (data: {
        newFEN: string;
        time: { blackTime: number; whiteTime: number };
      }) => {
        console.log(data);
        setPosition(data.newFEN);
        game.load(data.newFEN);
        setGameState((prev) => {
          return {
            ...prev,
            blackTime: data.time.blackTime,
            whiteTime: data.time.whiteTime,
          };
        });
      }
    );

    //look for any alerts
    socket.on("alert", (data: { type: GAME_END_TYPE; message?: string }) => {
      setGameState((prev) => {
        return { ...prev, state: GAME_STATE.HALTED };
      });
      setAlert({ open: true, type: data.type });
    });

    //listen for game start
    socket.on("game-started", () => {
      setGameState((prev) => {
        return { ...prev, state: GAME_STATE.INPROGRESS };
      });
    });

    socket.on(
      "game-over",
      (data: { result: GAME_END_TYPE; winner?: string }) => {
        setAlert({ open: true, type: data.result });
      }
    );
    socket.on("draw-response", (data: { answer: boolean }) => {
      if (data.answer) {
        toast({
          title: "Opponent Accepted Draw!",
        });
        router.push("/");
      } else {
        toast({
          title: "Opponent Rejected The Draw Appeal!",
        });
        setGameState((prev) => {
          return { ...prev, state: GAME_STATE.INPROGRESS };
        });
      }
    });

    return ()=>{
      socket.off('game-started')
      socket.off('game-over');
    }

  }, [id, router]);

  // Timer effect: starts the timer once the component is mounted
  useEffect(() => {
    if (gameState.state == GAME_STATE.INPROGRESS) {
      const timerId = startTimer();
      // Clean up timer on unmount
      return () => {
        clearInterval(timerId);
      };
    }
  }, [game.turn(), gameState.state]);

  // Handle piece drops
  const onPieceDrop = (sourceSquare: Square, targetSquare: Square) => {
    try {
      if (gameState.state != GAME_STATE.INPROGRESS) {
        return false;
      }

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // Always promote to queen
      });

      // If the move is invalid, display a toast notification
      if (move == null) {
        toast({
          title: "Invalid Move!",
        });
        return false;
      } else {
        const newPosition = game.fen(); // Get the new board position
        setPosition(newPosition); // Update position locally

        // Emit the move to the server
        socket?.emit("make-move", {
          roomId: id,
          from: sourceSquare,
          to: targetSquare,
          color: playerColor,
          time: playerColor == "w" ? gameState.whiteTime : gameState.blackTime,
        });

        return true;
      }
    } catch (err: any) {
      // Handle error and show a toast
      toast({
        title: "An error occurred",
        description: err.message || err,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <GameAlert
        type={alert.type}
        open={alert.open}
        alert={setAlert}
        gameId={id}
        socket={socket}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <Button
          variant={"link"}
          onClick={() => {
            router.push("/");
          }}
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back To Home
        </Button>
      </header>

      {/* Game area */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md mb-4">
          <div className="text-2xl font-bold dark:text-white text-right flex justify-between items-center">
            <span>Turn: {game.turn() == "w" ? "White" : "Black"}</span>
            <span
              style={{ color: game.turn() == playerColor ? "grey" : "black" }}
              className="bg-gray-200 w-fit p-2 rounded"
            >
              {playerColor == "b"
                ? `${formatTime(gameState.whiteTime)}`
                : `${formatTime(gameState.blackTime)}`}
            </span>
          </div>
        </div>

        {/* Chess board */}
        <div className="w-full max-w-md aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg">
          <Chessboard
            areArrowsAllowed={true}
            arePiecesDraggable={true}
            id="ChessGameWithTimers"
            position={position}
            arePremovesAllowed={true}
            onPieceDrop={onPieceDrop}
            boardOrientation={playerColor === "w" ? "white" : "black"} // Adjust orientation based on player color
          />
        </div>

        <div className="w-full max-w-md mt-4 ">
          <div
            className="text-2xl font-bold dark:text-white bg-gray-200 w-fit p-2 rounded "
            style={{ color: game.turn() == playerColor ? "black" : "gray" }}
          >
            {playerColor == "b"
              ? `${formatTime(gameState.blackTime)}`
              : `${formatTime(gameState.whiteTime)}`}
          </div>
        </div>

        {/* Game controls */}
        {gameState.state == GAME_STATE.INPROGRESS && (
          <div className="mt-4 flex space-x-2">
            <Button variant="destructive" onClick={handleResign}>
              Resign
            </Button>
            <Button variant="secondary" onClick={handleDraw}>
              Offer Draw
            </Button>
          </div>
        )}

        {gameState.state == GAME_STATE.NOTSTARTED && (
          <div className="mt-4 flex space-x-2">
            <Button variant="outline" onClick={handleGameStart}>
              Start Game
            </Button>
          </div>
        )}

        {gameState.state == GAME_STATE.HALTED && (
          <div className="mt-4 flex space-x-2">
            <Button variant="outline" onClick={handleGameStart}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
