import React from "react";
import Link from "next/link";
import { FaTwitch, FaDiscord, FaCoffee } from "react-icons/fa";

export const metadata = {
  title: "About - divoxutils",
};

const socialAndSupportData = [
  {
    name: "Twitch",
    icon: <FaTwitch className="mx-auto text-indigo-400 h-16 w-16 drop-shadow-lg" />,
    link: "https://www.twitch.tv/divoxzy",
  },
  {
    name: "Discord",
    icon: <FaDiscord className="mx-auto text-indigo-400 h-16 w-16 drop-shadow-lg" />,
    link: "https://discord.com/users/310750671576236033",
  },
  {
    name: "Ko-fi",
    icon: <FaCoffee className="mx-auto text-indigo-400 h-16 w-16 drop-shadow-lg" />,
    link: "https://ko-fi.com/divox#checkoutModal",
  },
];

const AboutPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            About divoxutils
          </h1>
        </header>

        <section className="space-y-6">
          <p className="text-sm leading-relaxed text-gray-400">
            Inspired by the legacy of daocutils and venerable predecessors like
            gimpchimp, divoxutils is crafted to honor their influence and to
            continue their mission.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            When daocutils was no longer available, it left a noticeable gap for
            many avid Dark Age of Camelot enthusiasts who needed a way to keep
            track of their characters. That&apos;s where the idea for divoxutils
            came in. I set out to create a new hub where players can easily
            manage their character&apos;s progress and celebrate their triumphs
            (rr12+ dings). Divoxutils is all about enhancing your gameplay by
            keeping you connected to your characters&apos; journeys in a
            user-friendly and engaging way.
          </p>

          <p className="text-sm leading-relaxed text-gray-400">
            The evolution of divoxutils is ongoing, and the horizon is brimming
            with potential new features. Your input and insights are invaluable
            to the ongoing development of divoxutils. I warmly welcome your
            suggestions and feedback—please don&apos;t hesitate to reach out
            with your thoughts via Discord, available through the link below.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            I&apos;m passionate about building and enhancing divoxutils, but it also 
            comes with real costs&mdash;server hosting, database maintenance, and 
            infrastructure to keep the service running smoothly for all users.
            If you&apos;ve found this tool helpful, please consider contributing 
            through the Ko-fi link below to help cover these operational costs 
            and support future development. Check out the{" "}
            <Link href="/contribute" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              contribute page
            </Link>{" "}
            to see how contributions are recognized.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            Your support doesn&apos;t end with financial contributions. Join the
            conversation and the community on Twitch. Follow along, jump into my
            streams to chat live, and be a part of the divoxutils story as it
            unfolds.
          </p>
        </section>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex justify-center space-x-8">
            {socialAndSupportData.map((item, index) => (
              <a
                key={index}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group transition-all duration-300 hover:scale-110 hover:-translate-y-1"
              >
                <div className="transition-all duration-300 group-hover:drop-shadow-2xl">
                  {item.icon}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
