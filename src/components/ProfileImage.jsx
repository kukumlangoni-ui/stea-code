import STEAAvatar from "./STEAAvatar.jsx";

// Backward-compatible adapter for upload flows; all rendering is now STEAAvatar.
export default function ProfileImage({ src, alt, userId, className = "" }) {
  return <STEAAvatar user={{ uid: userId, photoURL: src }} alt={alt} size="md" className={className} />;
}
