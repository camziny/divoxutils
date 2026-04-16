import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - divoxutils",
};

const SignInPage = () => {
  return (
    <div
      className="relative flex justify-center items-center bg-gray-900 px-4 overflow-hidden"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-gray-900 to-gray-900" />

      <div className="relative z-10 w-full max-w-md">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-gray-900/80 backdrop-blur-sm border border-gray-800/80 shadow-2xl shadow-black/40 rounded-2xl !p-6 sm:!p-8",
              headerTitle: "text-gray-100 text-xl font-semibold tracking-tight",
              headerSubtitle: "text-gray-400 text-sm mt-1",
              formFieldLabel: "text-gray-300 text-xs font-medium tracking-wide mb-1.5",
              formFieldInput:
                "bg-gray-800/60 border border-gray-700/80 text-gray-200 placeholder:text-gray-500 rounded-lg h-10 text-sm transition-all focus-visible:outline-none focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:bg-gray-800",
              formFieldInputShowPasswordButton:
                "text-gray-500 hover:text-gray-300 transition-colors",
              formButtonPrimary:
                "bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition-all shadow-sm shadow-indigo-900/30 hover:shadow-indigo-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
              formButtonReset:
                "text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors",
              footerActionLink:
                "text-indigo-400 hover:text-indigo-300 font-medium transition-colors",
              footerActionText: "text-gray-500 text-sm",
              socialButtonsBlockButton:
                "bg-gray-800/50 border border-gray-700/60 text-gray-200 hover:bg-gray-800 hover:border-gray-600 transition-all rounded-lg h-10",
              socialButtonsBlockButtonText: "text-gray-200 font-medium text-sm",
              socialButtonsBlockButtonArrow: "text-gray-500",
              dividerLine: "bg-gray-800/60",
              dividerText: "text-gray-600 text-xs uppercase tracking-wider",
              identityPreviewEditButton:
                "text-indigo-400 hover:text-indigo-300 transition-colors text-sm",
              identityPreviewText: "text-gray-300",
              formFieldErrorText: "text-red-400 text-xs mt-1",
              formFieldWarningText: "text-amber-400 text-xs mt-1",
              formFieldSuccessText: "text-emerald-400 text-xs mt-1",
              otpCodeFieldInput:
                "bg-gray-800/60 border border-gray-700/80 text-gray-200 rounded-lg focus-visible:border-indigo-500/60 focus-visible:ring-2 focus-visible:ring-indigo-500/20",
              footer: "bg-transparent pt-4",
              internal: "gap-6",
            },
          }}
        />
      </div>
    </div>
  );
};
export default SignInPage;
