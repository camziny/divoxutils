import { SignIn } from "@clerk/nextjs";

const SignInPage = () => {
  return (
    <div
      className="flex justify-center items-center bg-gray-900"
      style={{ minHeight: "calc(100vh - 64px)" }}
    >
      <SignIn
        appearance={{
          elements: {
            formButtonPrimary:
              "bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 rounded focus:outline-none focus:shadow-outline",
            inputLabel:
              "block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2",
          },
        }}
      />
    </div>
  );
};
export default SignInPage;
