import { ReactNode } from "react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { BadgeWall } from "../../components/BadgeWall";
import { QuestList } from "../../components/QuestList";
import { Leaderboard } from "../../components/Leaderboard";
import { RunLog } from "../../components/RunLog";

export default function VanguardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col gap-10 pb-20">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4">
        {children}
        <section className="grid gap-8 lg:grid-cols-2">
          <BadgeWall />
          <div className="space-y-6">
            <QuestList />
            <Leaderboard />
          </div>
        </section>
        <RunLog />
      </main>
      <Footer />
    </div>
  );
}
