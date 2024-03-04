import { FaDiscord } from "react-icons/fa";
import Image from "next/image";

export const metadata = {
  title: "Discord Bot - divoxutils",
};

const DiscordPage = () => {
  return (
    <div className="bg-gray-900 min-h-screen flex p-4 lg:py-12">
      <div className="flex-1 container mx-auto bg-gray-900 p-6 sm:p-10 rounded-xl shadow-lg space-y-6">
        <div className="bg-gray-900 p-4 rounded-lg shadow-md">
          <header className="text-center mb-2">
            <h1 className="text-2xl sm:text-4xl font-semibold text-white mb-4">
              Discord Bot
            </h1>
            <div className="h-1 w-24 bg-indigo-500 mx-auto"></div>
          </header>
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="w-full sm:w-3/4 lg:w-2/3 xl:w-1/2 text-left">
              <p className="text-white text-sm sm:text-base md:text-lg leading-relaxed text-center sm:text-left">
                The divoxutils Discord bot is designed to seamlessly integrate
                with your Discord server, providing access to a range of
                commands that fetch information and statistics about users and
                their characters. This integration allows server members to
                quickly retrieve relevant data directly within Discord,
                enhancing your overall DAOC experience by making key information
                readily available.
              </p>
            </div>
            <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3 xl:w-1/4">
              <a
                href="https://discord.com/api/oauth2/authorize?client_id=1204568123584552960&permissions=0&scope=bot%20applications.commands"
                className="flex items-center justify-center bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaDiscord className="mr-3" size={50} />
                <span className="text-base">Add divoxutils Bot</span>
              </a>
            </div>
          </div>
        </div>
        <div className="space-y-8" id="character-info">
          <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-extrabold text-indigo-400 mb-4">
              /character-info
            </h2>
            <p className="text-base text-white leading-8 mb-2">
              Retrieves basic information for a specific character in the game.
              This command does not require the character to be registered on
              divoxutils.
            </p>
            <h3 className="text-lg font-semibold text-white">Usage</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /character-info name:&lt;character_name&gt;
              </code>
            </div>
            <h3 className="text-lg font-semibold text-white">Example</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /character-info name:divoxx
              </code>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Output</h3>
            <div className="text-center">
              <Image
                src="/character-info example.png"
                alt="Character Info Example"
                width={125}
                height={50}
                className="rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="space-y-8" id="character-stats">
          <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-extrabold text-indigo-400 mb-4">
              /character-stats
            </h2>
            <p className="text-base text-white leading-8 mb-2">
              Retrieves detailed statistics for a specific character. The
              character must be registered on divoxutils.
            </p>
            <h3 className="text-lg font-semibold">Usage</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /character-stats name:&lt;character_name&gt;
              </code>
            </div>
            <h3 className="text-lg font-semibold">Example</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /character-stats name:divoxx
              </code>
            </div>
            <h3 className="text-lg font-semibold mb-2">Output</h3>
            <div className="text-center">
              <Image
                src="/character-stats example.png"
                alt="Character Stats Example"
                width={125}
                height={50}
                className="rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="space-y-8" id="user-stats">
          <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-extrabold text-indigo-400 mb-4">
              /user-stats
            </h2>
            <p className="text-base text-white leading-8 mb-2">
              Retrieves detailed statistics for a specific user. The user must
              be registered on divoxutils.
            </p>
            <h3 className="text-lg font-semibold">Usage</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /user-stats name:&lt;user_name&gt;
              </code>
            </div>
            <h3 className="text-lg font-semibold">Example</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /user-stats name:divox
              </code>
            </div>
            <h3 className="text-lg font-semibold mb-2">Output</h3>
            <div className="text-center">
              <Image
                src="/user-stats example.png"
                alt="Character Stats Example"
                width={175}
                height={150}
                className="rounded-md"
              />
            </div>
          </div>
        </div>
        <div className="space-y-8" id="user-characters">
          <div className="bg-gray-700 p-4 rounded-lg shadow-md">
            <h2 className="text-2xl font-extrabold text-indigo-400 mb-4">
              /user-characters
            </h2>
            <p className="text-base text-white leading-8 mb-2">
              Retrieves a list of characters associated with a user. The user
              must be registered on divoxutils. The command can be tailored to
              display characters based on realm and class type.
            </p>
            <h3 className="text-lg font-semibold">Usage</h3>
            <div className="bg-gray-600 p-2 rounded-md">
              <code className="text-sm sm:text-base text-indigo-200">
                /user-characters name:&lt;user_name&gt; [realm:&lt;realm&gt;]
                [classtype:&lt;class_type&gt;]
              </code>
            </div>
            <div className="text-sm sm:text-base text-white leading-8 mb-2">
              <table className="table-auto w-full text-left">
                <thead>
                  <tr className="text-white">
                    <th>Parameter</th>
                    <th>Description</th>
                    <th>Options</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-700">
                    <td>
                      <strong>name</strong>
                    </td>
                    <td>The name of the user.</td>
                    <td>-</td>
                  </tr>
                  <tr className="bg-gray-600">
                    <td>
                      <strong>realm</strong> (optional)
                    </td>
                    <td>Filter characters by realm.</td>
                    <td>alb, hib, mid</td>
                  </tr>
                  <tr className="bg-gray-700">
                    <td>
                      <strong>classtype</strong> (optional)
                    </td>
                    <td>Filter characters by class type.</td>
                    <td>tank, caster, support, stealth</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold">Example</h3>
            <div className="bg-gray-600 p-2 rounded-md mb-2">
              <code className="text-sm sm:text-base text-indigo-200">
                /user-characters name:divox realm:alb classtype:support
              </code>
            </div>
            <h3 className="text-lg font-semibold mb-2">Output</h3>
            <div className="text-center">
              <Image
                src="/user-characters example.png"
                alt="Character Stats Example"
                width={150}
                height={100}
                className="rounded-md"
              />
            </div>
          </div>
        </div>
        <p className="text-sm italic">
          *Note: The images above are for illustration purposes only. Your
          actual output may vary depending on the character&apos;s or
          user&apos;s data.*
        </p>
      </div>
    </div>
  );
};

export default DiscordPage;
