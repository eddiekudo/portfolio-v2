import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Work from "../components/Work";
import About from "../components/About";
import Contact from "../components/Contact";

export const dynamic = "force-static";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Work />
        <About />
      </main>
      <Contact />
    </>
  );
}
