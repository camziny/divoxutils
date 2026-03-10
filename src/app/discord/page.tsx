import { FaDiscord } from "react-icons/fa";
import Image from "next/image";

export const metadata = {
  title: "Discord Bot - divoxutils",
};

const COMMANDS = [
  { id: "draft", label: "/draft" },
  { id: "draft-setup", label: "/draft-setup" },
  { id: "character-info", label: "/character-info" },
  { id: "character-stats", label: "/character-stats" },
  { id: "user-stats", label: "/user-stats" },
  { id: "user-characters", label: "/user-characters" },
  { id: "compare-users", label: "/compare-users" },
  { id: "compare-chars", label: "/compare-chars" },
];

export default function DiscordPage() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <div className="mx-auto max-w-3xl px-4 py-16 space-y-16">
        <header className="space-y-4">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Discord Bot
          </h1>
          <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
            The divoxutils bot adds slash commands to your Discord server for
            looking up characters, comparing stats, and running live drafts.
          </p>
          <div className="pt-2">
            <a
              href="https://discord.com/api/oauth2/authorize?client_id=1204568123584552960&permissions=0&scope=bot%20applications.commands"
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord className="h-3.5 w-3.5" />
              Add to Server
            </a>
          </div>
        </header>

        <nav className="rounded-lg border border-gray-800 bg-gray-900/40 p-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium mb-3">
            Commands
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMANDS.map((cmd) => (
              <a
                key={cmd.id}
                href={`#${cmd.id}`}
                className="rounded-md border border-gray-800 bg-gray-900/60 px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-700 hover:text-white"
              >
                {cmd.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-12">
          <CommandSection
            id="draft"
            title="/draft"
            description="Start a live draft from your Discord server. The bot pulls players from your configured lobby voice channel and creates a real-time draft page where captains pick teams, set bans, and choose realms."
            usage="/draft"
            howSections={[
              {
                title: "Starting Draft",
                steps: [
                  "Before /draft, all players must already be in the configured lobby voice channel. Bots are not pulled into drafts.",
                  "The person who runs /draft is the creator and gets the private setup DM.",
                  "Creator sets mode/team size, assigns captains, and chooses bans per captain.",
                  "Creator can set automatic bans (optional) and can still be a captain if needed.",
                  "After start, a public draft link is posted and each captain gets a private captain link by DM.",
                ],
              },
              {
                title: "During Draft Set",
                steps: [
                  "Captains must update each player's class every fight if anything changes.",
                  "Use the class board to check player characters; indigo underlines show extra details and hover reveals realm rank.",
                  "Creator must update the set score after each fight.",
                  "If class or score updates are incomplete, the draft won't be verified and stats won't be recorded.",
                ],
              },
            ]}
          />
          <div className="border-l-2 border-indigo-900 bg-gray-900/30 pl-3 pr-3 py-2.5 rounded-r-sm space-y-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              If a player is swapped mid-draft, continue recording for the
              original slot. You must message me so I can correct it after the set.
            </p>
            <a
              href="https://discord.com/users/310750671576236033"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <FaDiscord className="h-3 w-3" />
              <span>Message me on Discord</span>
            </a>
          </div>

          <CommandSection
            id="draft-setup"
            title="/draft-setup"
            description="Configure the voice channels used by the draft system. Run this once before /draft. Requires Manage Channels permission."
            usage="/draft-setup lobby-channel:#lobby team1-channel:#team-1 team2-channel:#team-2"
            params={[
              {
                name: "lobby-channel",
                desc: "Voice channel to pull players from when /draft is run. Do not use your server's default General voice channel as the lobby.",
              },
              {
                name: "team1-channel",
                desc: "Voice channel to move Team 1 into after the draft.",
              },
              {
                name: "team2-channel",
                desc: "Voice channel to move Team 2 into after the draft.",
              },
            ]}
          />

          <div className="border-t border-gray-800" />

          <CommandSection
            id="character-info"
            title="/character-info"
            description="Retrieves basic information for a character. Does not require the character to be registered on divoxutils."
            usage="/character-info name:<character_name>"
            example="/character-info name:divoxx"
            image="/character-info example.png"
            imageWidth={125}
          />

          <CommandSection
            id="character-stats"
            title="/character-stats"
            description="Retrieves detailed statistics for a character. The character must be registered on divoxutils."
            usage="/character-stats name:<character_name>"
            example="/character-stats name:divoxx"
            image="/character-stats example.png"
            imageWidth={125}
          />

          <CommandSection
            id="user-stats"
            title="/user-stats"
            description="Retrieves detailed statistics for a user. The user must be registered on divoxutils."
            usage="/user-stats name:<user_name>"
            example="/user-stats name:divox"
            image="/user-stats example.png"
            imageWidth={175}
          />

          <CommandSection
            id="user-characters"
            title="/user-characters"
            description="Retrieves a list of characters for a user, with optional realm and class type filters. The user must be registered on divoxutils."
            usage="/user-characters name:<user_name> [realm:<realm>] [classtype:<class_type>]"
            example="/user-characters name:divox realm:alb classtype:support"
            image="/user-characters example.png"
            imageWidth={150}
            params={[
              { name: "name", desc: "The user to look up." },
              {
                name: "realm",
                desc: "Filter by realm.",
                optional: true,
                options: "alb, hib, mid",
              },
              {
                name: "classtype",
                desc: "Filter by class type.",
                optional: true,
                options: "tank, caster, support, stealth",
              },
            ]}
          />

          <CommandSection
            id="compare-users"
            title="/compare-users"
            description="Compares the stats of two users, including realm points, solo kills, deaths, and IRS. Both users must be registered on divoxutils."
            usage="/compare-users name1:<user_name> name2:<user_name>"
            example="/compare-users name1:divox name2:barbarianz"
            image="/compare-users.png"
            imageWidth={150}
            params={[
              { name: "name1", desc: "First user." },
              { name: "name2", desc: "Second user." },
            ]}
          />

          <CommandSection
            id="compare-chars"
            title="/compare-chars"
            description="Compares the stats of two characters. Both characters must be registered on divoxutils."
            usage="/compare-chars name1:<character_name> name2:<character_name>"
            example="/compare-chars name1:patarhahahehe name2:xuuhahahehe"
            image="/compare-characters.png"
            imageWidth={150}
            params={[
              { name: "name1", desc: "First character." },
              { name: "name2", desc: "Second character." },
            ]}
          />
        </div>

        <footer className="border-t border-gray-800 pt-8">
          <p className="text-xs text-gray-600">
            Output images are for illustration purposes. Actual results may vary.
          </p>
        </footer>
      </div>
    </div>
  );
}

function CommandSection({
  id,
  title,
  description,
  usage,
  example,
  image,
  imageWidth,
  params,
  how,
  howSections,
}: {
  id: string;
  title: string;
  description: string;
  usage: string;
  example?: string;
  image?: string;
  imageWidth?: number;
  params?: { name: string; desc: string; optional?: boolean; options?: string }[];
  how?: string[];
  howSections?: { title: string; steps: string[] }[];
}) {
  return (
    <section id={id} className="scroll-mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="rounded-md bg-gray-900/60 border border-gray-800 px-3 py-2">
        <code className="text-xs text-indigo-300 font-mono">{usage}</code>
      </div>

      {how && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-400">How it works</p>
          <ol className="space-y-1 text-xs text-gray-500 list-decimal list-inside">
            {how.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {howSections && (
        <div className="space-y-3">
          {howSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <p className="text-xs font-medium text-gray-400">{section.title}</p>
              <ol className="space-y-1 text-xs text-gray-500 list-decimal list-inside">
                {section.steps.map((step, i) => (
                  <li key={`${section.title}-${i}`}>{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {params && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="text-left py-1.5 pr-4 font-medium">Parameter</th>
                <th className="text-left py-1.5 pr-4 font-medium">Description</th>
                {params.some((p) => p.options) && (
                  <th className="text-left py-1.5 font-medium">Options</th>
                )}
              </tr>
            </thead>
            <tbody>
              {params.map((p) => (
                <tr key={p.name} className="border-b border-gray-800/50">
                  <td className="py-1.5 pr-4">
                    <span className="text-indigo-400 font-medium">{p.name}</span>
                    {p.optional && (
                      <span className="text-gray-600 ml-1">(optional)</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-4 text-gray-400">{p.desc}</td>
                  {params.some((pp) => pp.options) && (
                    <td className="py-1.5 text-gray-500 font-mono">
                      {p.options || "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {example && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Example</p>
          <div className="rounded-md bg-gray-900/60 border border-gray-800 px-3 py-2">
            <code className="text-xs text-indigo-300 font-mono">{example}</code>
          </div>
        </div>
      )}

      {image && (
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1.5">Output</p>
          <Image
            src={image}
            alt={`${title} example`}
            width={imageWidth || 150}
            height={100}
            className="rounded-md border border-gray-800"
          />
        </div>
      )}
    </section>
  );
}
