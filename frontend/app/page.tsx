import Nav from "./components/Nav";
import Hero from "./components/Hero";
import PhoneMockupStack from "./components/PhoneMockupStack";
import HowItWorks from "./components/HowItWorks";
import LiveStatsBar from "./components/LiveStatsBar";
import RoadmapTimeline from "./components/RoadmapTimeline";
import FaqAccordion from "./components/FaqAccordion";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-surface">
      <Nav />
      <main className="flex flex-col flex-1">
        <Hero />
        <PhoneMockupStack />
        <HowItWorks />
        <LiveStatsBar />
        <RoadmapTimeline />
        <FaqAccordion />
      </main>
      <Footer />
    </div>
  );
}
