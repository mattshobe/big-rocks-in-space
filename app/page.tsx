import AsteroidsGame from "@/components/asteroids-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <h1 className="mb-4 text-3xl font-bold text-white">ASTEROIDS</h1>
      <AsteroidsGame />
    </main>
  )
}
