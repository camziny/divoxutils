import React from "react";
import { FaTwitch, FaDiscord, FaCoffee } from "react-icons/fa";

export const metadata = {
  title: "About - divoxutils",
};

const socialAndSupportData = [
  {
    name: "Twitch",
    icon: <FaTwitch className="mx-auto text-indigo-400 h-16 w-16 drop-shadow-lg" />,
    link: "https://www.twitch.tv/divox",
  },
  {
    name: "Discord",
    icon: <FaDiscord className="mx-auto text-indigo-400 h-16 w-16 drop-shadow-lg" />,
    link: "https://discord.gg/divox",
  },
  {
    name: "Ko-fi",
    icon: <FaCoffee className="mx-auto text-indigo-400 h-16 w-16 drop-shadow-lg" />,
    link: "https://ko-fi.com/divox#checkoutModal",
  },
];

const AboutPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4 lg:py-12">
      <div className="container mx-auto max-w-4xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-12 rounded-2xl shadow-2xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
            About divoxutils
          </h1>
          <div className="h-1 w-32 bg-indigo-500 mx-auto rounded-full"></div>
        </header>
        
        <section className="mx-auto text-white space-y-6">
          <p className="text-base sm:text-lg leading-relaxed text-gray-300">
            Inspired by the legacy of daocutils and venerable predecessors like
            gimpchimp, divoxutils is crafted to honor their influence and to
            continue their mission.
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-gray-300">
            When daocutils was no longer available, it left a noticeable gap for
            many avid Dark Age of Camelot enthusiasts who needed a way to keep
            track of their characters. That&apos;s where the idea for divoxutils
            came in. I set out to create a new hub where players can easily
            manage their character&apos;s progress and celebrate their triumphs
            (rr12+ dings). Divoxutils is all about enhancing your gameplay by
            keeping you connected to your characters&apos; journeys in a
            user-friendly and engaging way.
          </p>

          <p className="text-base sm:text-lg leading-relaxed text-gray-300">
            The evolution of divoxutils is ongoing, and the horizon is brimming
            with potential new features. Your input and insights are invaluable
            to the ongoing development of divoxutils. I warmly welcome your
            suggestions and feedback—please don&apos;t hesitate to reach out
            with your thoughts via Discord, available through the link below.
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-gray-300">
            I&apos;m passionate about building and enhancing divoxutils, but it also 
            comes with real costs—server hosting, database maintenance, and 
            infrastructure to keep the service running smoothly for all users.
            If you&apos;ve found this tool helpful, please consider contributing 
            through the Ko-fi link below to help cover these operational costs 
            and support future development.
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-gray-300">
            Your support doesn&apos;t end with financial contributions. Join the
            conversation and the community on Twitch. Follow along, jump into my
            streams to chat live, and be a part of the divoxutils story as it
            unfolds.
          </p>
        </section>
        
        <div className="text-center mt-12 pt-8 border-t border-gray-700/50">
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
