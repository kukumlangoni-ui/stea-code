import { useClerk } from "@clerk/clerk-react";
export default function ClerkSignInButton({ className, children, style, onClick, ...rest }) {
  const clerk = useClerk();
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={(e) => {
        if (typeof onClick === "function") onClick(e);
        try {
          clerk.openSignIn();
        } catch (err) {
          console.error("[ClerkSignInButton] openSignIn failed:", err);
        }
      }}
      {...rest}
    >
      {children || "Sign In"}
    </button>
  );
}
