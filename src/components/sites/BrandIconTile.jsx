/**
 * BrandIconTile — Wrapper around unified WebsiteIcon
 */
import { memo } from "react";
import WebsiteIcon from "./WebsiteIcon.jsx";

function BrandIconTile({
  name = "",
  domain = "",
  url = "",
  website,
  size = 42,
  className = "",
}) {
  const resolved = website || { name, domain, url };
  return <WebsiteIcon website={resolved} size={size} className={className} />;
}

export default memo(BrandIconTile);
