"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {

  GiChessBishop,
  GiChessKnight,
  GiChessQueen,
  GiRamProfile,
} from "react-icons/gi";
import {
  CalendarDays,
  Trophy,
  User,
  Activity,
  Clock,
  Users,
  Zap,
  LucideLoaderCircle,
} from "lucide-react";
import { Socket } from "socket.io-client";

import { useSocket } from "@/providers/socketProvider";

// Mock data (replace with actual data fetching in a real application)
const recentMatches = [
  {
    id: 1,
    opponent: "Alice",
    result: "Win",
    date: "2023-06-01",
    ratingChange: 15,
  },
  {
    id: 2,
    opponent: "Bob",
    result: "Loss",
    date: "2023-05-28",
    ratingChange: -12,
  },
  {
    id: 3,
    opponent: "Charlie",
    result: "Draw",
    date: "2023-05-25",
    ratingChange: 0,
  },
];

const playerStats = {
  rating: 1500,
  wins: 25,
  losses: 15,
  draws: 10,
  winRate: 62.5,
};


export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const socket: Socket = useSocket();
  const [stats, setStats] = useState({
    online_players:0,
    matchmaking:0,
    games_in_progress:0
  });
  const [gameFound, setGameFound] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      console.log(session);
    }

    try {
      // if (!socket) return;

      socket.emit("map-data", {
        playerId: session?.user?.email,
        user: session?.user,
      });

      socket.on("update-stats", (data) => {
        setStats(data);
        console.log(data);
      });

      socket.on(
        "game-created",
        (data: { roomId: string; opponent: string }) => {
          setGameFound(true);
          console.log(data);

          router.push("/room/" + data.roomId);
        }
      );
    } catch (err) {
      console.error("Error COnnecting To The Server, Please Refresh the page.");
    }
  }, [status, router]);

  const handleQuickPlay = async () => {
    try {
      setIsMatchmaking(true);
      fetch(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL + "/find-match", {
        method: "POST",
        body: JSON.stringify({
          playerId: session?.user?.email,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        const json = await res.json();
        console.log(json);
      });
    } catch (err) {
      console.log(err);
    }
  };

  if (status === "loading") {
    return <SkeletonLoader />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground mt-24">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Info */}
          <Card className="col-span-1 lg:col-span-2 bg-background shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary flex items-center">
                <GiRamProfile className="mr-2" />
                Player Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-24 w-24 border-2 border-green-300">
                  <AvatarImage
                    src={session.user?.image || ""}
                    alt={session.user?.name || "User"}
                  />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-2xl font-semibold text-primary">
                    {session.user?.name}
                  </p>
                  <p className="text-muted-foreground">{session.user?.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    <Trophy className="h-4 w-4 mr-1" />
                    Rating: {playerStats.rating}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col items-center p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-lg">
                  <GiChessQueen className="h-8 w-8 mb-2" />
                  <span className="text-2xl font-bold">{playerStats.wins}</span>
                  <span className="text-sm">Wins</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-lg">
                  <GiChessBishop className="h-8 w-8 mb-2" />
                  <span className="text-2xl font-bold">
                    {playerStats.losses}
                  </span>
                  <span className="text-sm">Losses</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 rounded-lg">
                  <GiChessKnight className="h-8 w-8 mb-2" />
                  <span className="text-2xl font-bold">
                    {playerStats.draws}
                  </span>
                  <span className="text-sm">Draws</span>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-primary">
                    Win Rate
                  </span>
                  <span className="text-sm font-medium text-primary">
                    {playerStats.winRate}%
                  </span>
                </div>
                <Progress value={playerStats.winRate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Online Stats and Quick Play */}
          <Card className="col-span-1 bg-background shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary flex items-center">
                <Activity className="mr-2" />
                Live Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Online Players
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {stats.online_players}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Matchmaking
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {stats.matchmaking}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center">
                    <GiChessKnight className="h-4 w-4 mr-2" />
                    Games in Progress
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {stats.games_in_progress}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleQuickPlay}
                className="w-full mt-6"
                size="lg"
              >
                <Zap className="mr-2 h-4 w-4" /> Quick Play
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Matches History */}
        <Card className="mt-6 bg-background shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary flex items-center">
              <Clock className="mr-2" />
              Recent Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <ul className="space-y-4">
                {recentMatches.map((match) => (
                  <li
                    key={match.id}
                    className="flex justify-between items-center p-3 bg-accent rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-primary">
                        {match.opponent}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 inline mr-1" />
                        {match.date}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          match.result === "Win"
                            ? "success"
                            : match.result === "Loss"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {match.result}
                      </Badge>
                      <span
                        className={`ml-2 ${
                          match.ratingChange > 0
                            ? "text-green-600 dark:text-green-400"
                            : match.ratingChange < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {match.ratingChange > 0 ? "+" : ""}
                        {match.ratingChange}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isMatchmaking} onOpenChange={setIsMatchmaking}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finding a Match</DialogTitle>
            <DialogDescription>
              {!gameFound && (
                <h1>Please wait while we find an opponent for you...</h1>
              )}
              {gameFound && <h2>Game Found!</h2>}
            </DialogDescription>
          </DialogHeader>
          {!gameFound && (
            <LucideLoaderCircle className="animate-spin mx-auto h-12 w-12" />
          )}
          {gameFound && <Trophy className="mx-auto h-12 w-12" />}
          {!gameFound && (
            <div className="text-center text-sm text-muted-foreground">
              This may take a few moments
            </div>
          )}
          {gameFound && (
            <div className="text-center text-sm text-muted-foreground">
              Starting The Game!
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Player Info Skeleton */}
          <Card className="col-span-1 lg:col-span-2 bg-background shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-64 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Online Stats Skeleton */}
          <Card className="col-span-1 bg-background shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-10 w-full mt-6" />
            </CardContent>
          </Card>
        </div>

        {/* Matches History Skeleton */}
        <Card className="mt-6 bg-background shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-3 bg-accent rounded-lg"
                >
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-6 w-16 mr-2" />
                    <Skeleton className="h-6 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
