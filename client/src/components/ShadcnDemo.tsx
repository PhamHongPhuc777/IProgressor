import { useEffect, useState } from "react"
import { Flame, Target, TrendingUp, Plus, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const habits = [
  { name: "Deep work session", progress: 80, streak: 12 },
  { name: "Read 20 pages", progress: 45, streak: 4 },
  { name: "Strength training", progress: 100, streak: 21 },
]

export function ShadcnDemo() {
  const [isDark, setIsDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  return (
    <div className="min-h-svh bg-background p-6 text-foreground sm:p-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              IProgressor
            </h1>
            <p className="text-sm text-muted-foreground">
              shadcn/ui + Tailwind + React/TS demo
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setIsDark((prev) => !prev)}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Avatar>
              <AvatarImage src="" alt="User" />
              <AvatarFallback>IP</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Active streak</CardDescription>
              <CardTitle className="flex items-center gap-1.5 text-2xl">
                <Flame className="size-5 text-orange-500" />
                21 days
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Weekly goal</CardDescription>
              <CardTitle className="flex items-center gap-1.5 text-2xl">
                <Target className="size-5 text-primary" />
                4 / 5
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Trend</CardDescription>
              <CardTitle className="flex items-center gap-1.5 text-2xl">
                <TrendingUp className="size-5 text-green-600" />
                +12%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's habits</CardTitle>
            <CardDescription>Track your daily progress</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {habits.map((habit) => (
              <div key={habit.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{habit.name}</span>
                  <Badge variant={habit.progress === 100 ? "default" : "secondary"}>
                    {habit.streak} day streak
                  </Badge>
                </div>
                <Progress value={habit.progress} />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button size="sm">
              <Plus className="size-4" data-icon="inline-start" />
              Add habit
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings preview</CardTitle>
            <CardDescription>Tabs, inputs and form controls</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="flex flex-col gap-4 pt-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="display-name">Display name</Label>
                  <Input id="display-name" placeholder="e.g. inappropriatehuman13" />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Cancel</Button>
                  <Button size="sm">Save changes</Button>
                </div>
              </TabsContent>
              <TabsContent value="notifications" className="pt-4 text-sm text-muted-foreground">
                No notification settings configured yet.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
