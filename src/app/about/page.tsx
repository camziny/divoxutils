import React from "react";
import { FaTwitch, FaDiscord } from "react-icons/fa";
import { BiCoffee } from "react-icons/bi";

export const metadata = {
  title: "About - divoxutils",
};

const socialAndSupportData = [
  {
    name: "Twitch",
    icon: <FaTwitch className="mx-auto text-indigo-500 h-16 w-16" />,
    link: "https://www.twitch.tv/divox",
  },
  {
    name: "Discord",
    icon: <FaDiscord className="mx-auto text-indigo-500 h-16 w-16" />,
    link: "https://discord.gg/divox",
  },
  {
    name: "Ko-fi",
    icon: <BiCoffee className="mx-auto text-indigo-500 h-16 w-16" />,
    link: "https://ko-fi.com/divox#checkoutModal",
  },
];

const AboutPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4 lg:py-12">
      <div className="container mx-auto bg-gray-800 p-6 sm:p-10 rounded-xl shadow-lg space-y-6">
        <header className="text-center">
          <h1 className="text-3xl sm:text-5xl font-semibold text-white mb-4">
            About divoxutils
          </h1>
          <div className="h-1 w-24 bg-indigo-500 mx-auto"></div>
        </header>
        <section className="mx-auto text-white space-y-4">
          <p className="text-base sm:text-lg leading-relaxed">
            Inspired by the legacy of daocutils and venerable predecessors like
            gimpchimp, divoxutils is crafted to honor their influence and to
            continue their mission.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            When daocutils was no longer available, it left a noticeable gap for
            many avid Dark Age of Camelot enthusiasts who needed a way to keep
            track of their characters. That&apos;s where the idea for divoxutils
            came in. I set out to create a new hub where players can easily
            manage their character&apos;s progress and celebrate their triumphs
            (rr12+ dings). Divoxutils is all about enhancing your gameplay by
            keeping you connected to your characters&apos; journeys in a
            user-friendly and engaging way.
          </p>

          <p className="text-base sm:text-lg leading-relaxed">
            The evolution of divoxutils is ongoing, and the horizon is brimming
            with potential new features. Your input and insights are invaluable
            to the ongoing development of divoxutils. I warmly welcome your
            suggestions and feedback—please don&apos;t hesitate to reach out
            with your thoughts via Discord, available through the link below.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            I&apos;m passionate about building and enhancing divoxutils, but it also 
            comes with real costs—server hosting, database maintenance, and 
            infrastructure to keep the service running smoothly for all users.
            If you&apos;ve found this tool helpful, please consider contributing 
            through the Ko-fi link below to help cover these operational costs 
            and support future development.
          </p>
          <p className="text-base sm:text-lg leading-relaxed">
            Your support doesn&apos;t end with financial contributions. Join the
            conversation and the community on Twitch. Follow along, jump into my
            streams to chat live, and be a part of the divoxutils story as it
            unfolds.
          </p>
        </section>
        <div className="text-center mt-8 p-4">
          {socialAndSupportData.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mx-2"
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
