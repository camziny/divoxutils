import { FaDiscord } from "react-icons/fa";
import Image from "next/image";

export const metadata = {
  title: "Discord Bot - divoxutils",
};

const DiscordPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4 lg:py-12">
      <div className="container mx-auto max-w-4xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 sm:p-12 rounded-2xl shadow-2xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
            Discord Bot
          </h1>
          <div className="h-1 w-32 bg-indigo-500 mx-auto rounded-full"></div>
        </header>

        <div className="text-center space-y-8">
          <div className="mx-auto max-w-3xl">
            <p className="text-base sm:text-lg leading-relaxed text-gray-300">
              The divoxutils Discord bot is designed to seamlessly integrate
              with your Discord server, providing access to a range of
              commands that fetch information and statistics about users and
              their characters. This integration allows server members to
              quickly retrieve relevant data directly within Discord,
              enhancing your overall DAOC experience by making key information
              readily available.
            </p>
          </div>

          <div className="pt-4">
            <a
              href="https://discord.com/api/oauth2/authorize?client_id=1204568123584552960&permissions=0&scope=bot%20applications.commands"
              className="inline-flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDiscord className="mr-3" size={32} />
              <span className="text-lg">Add divoxutils Bot</span>
            </a>
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-gray-700/50">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">
              /character-info
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Retrieves basic information for a specific character in the game.
              This command does not require the character to be registered on
              divoxutils.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /character-info name:&lt;character_name&gt;
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Example</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /character-info name:divoxx
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
                <div className="text-center">
                  <Image
                    src="/character-info example.png"
                    alt="Character Info Example"
                    width={125}
                    height={50}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">
              /character-stats
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Retrieves detailed statistics for a specific character. The
              character must be registered on divoxutils.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /character-stats name:&lt;character_name&gt;
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Example</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /character-stats name:divoxx
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
                <div className="text-center">
                  <Image
                    src="/character-stats example.png"
                    alt="Character Stats Example"
                    width={125}
                    height={50}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">
              /user-stats
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Retrieves detailed statistics for a specific user. The user must
              be registered on divoxutils.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /user-stats name:&lt;user_name&gt;
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Example</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /user-stats name:divox
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
                <div className="text-center">
                  <Image
                    src="/user-stats example.png"
                    alt="User Stats Example"
                    width={175}
                    height={150}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">
              /user-characters
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Retrieves a list of characters associated with a user. The user
              must be registered on divoxutils. The command can be tailored to
              display characters based on realm and class type.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /user-characters name:&lt;user_name&gt; [realm:&lt;realm&gt;]
                    [classtype:&lt;class_type&gt;]
                  </code>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="text-white border-b border-gray-600">
                      <th className="text-left py-2 px-4">Parameter</th>
                      <th className="text-left py-2 px-4">Description</th>
                      <th className="text-left py-2 px-4">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">name</strong>
                      </td>
                      <td className="py-2 px-4">The name of the user.</td>
                      <td className="py-2 px-4">-</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">realm</strong> (optional)
                      </td>
                      <td className="py-2 px-4">Filter characters by realm.</td>
                      <td className="py-2 px-4">alb, hib, mid</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">classtype</strong> (optional)
                      </td>
                      <td className="py-2 px-4">Filter characters by class type.</td>
                      <td className="py-2 px-4">tank, caster, support, stealth</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Example</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /user-characters name:divox realm:alb classtype:support
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
                <div className="text-center">
                  <Image
                    src="/user-characters example.png"
                    alt="User Characters Example"
                    width={150}
                    height={100}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">
              /compare-users
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Compares the stats of two users registered on divoxutils. This
              command retrieves and displays a comparison of their total and
              last week&apos;s stats, including realm points, solo kills,
              deaths, and IRS. The users must be registered on divoxutils to use
              this command.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /compare-users name1:&lt;user_name&gt; name2:&lt;user_name&gt;
                  </code>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="text-white border-b border-gray-600">
                      <th className="text-left py-2 px-4">Parameter</th>
                      <th className="text-left py-2 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">name1</strong>
                      </td>
                      <td className="py-2 px-4">The name of the first user.</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">name2</strong>
                      </td>
                      <td className="py-2 px-4">The name of the second user.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Example</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /compare-users name1:divox name2:barbarianz
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
                <div className="text-center">
                  <Image
                    src="/compare-users.png"
                    alt="Compare Users Example"
                    width={150}
                    height={100}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/30">
            <h2 className="text-2xl font-bold text-indigo-400 mb-4">
              /compare-chars
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Compares the stats of two characters registered on divoxutils.
              This command retrieves and displays a comparison of their total
              and last week&apos;s stats, including realm points, solo kills,
              deaths, and IRS. The characters must be registered on divoxutils
              to use this command.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Usage</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /compare-chars name1:&lt;character_name&gt;
                    name2:&lt;character_name&gt;
                  </code>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-300">
                  <thead>
                    <tr className="text-white border-b border-gray-600">
                      <th className="text-left py-2 px-4">Parameter</th>
                      <th className="text-left py-2 px-4">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">name1</strong>
                      </td>
                      <td className="py-2 px-4">The name of the first character.</td>
                    </tr>
                    <tr className="border-b border-gray-700/50">
                      <td className="py-2 px-4">
                        <strong className="text-indigo-400">name2</strong>
                      </td>
                      <td className="py-2 px-4">The name of the second character.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Example</h3>
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700/40">
                  <code className="text-indigo-300 font-mono">
                    /compare-chars name1:patarhahahehe name2:xuuhahahehe
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
                <div className="text-center">
                  <Image
                    src="/compare-characters.png"
                    alt="Compare Characters Example"
                    width={150}
                    height={100}
                    className="rounded-lg shadow-md"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-8 border-t border-gray-700/50">
          <p className="text-sm italic text-gray-400">
            *Note: The images above are for illustration purposes only. Your
            actual output may vary depending on the character&apos;s or
            user&apos;s data.*
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiscordPage;
