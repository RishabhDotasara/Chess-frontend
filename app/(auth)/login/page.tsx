"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad } from "lucide-react"
import { signIn } from "next-auth/react"


export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-green-400 to-blue-500">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Chess Game</CardTitle>
          <CardDescription>Sign in to start playing</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            <Gamepad className="mr-2"/>
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}