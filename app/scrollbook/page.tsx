import { redirect } from "next/navigation";

// Stories live at /scrollbook/<slug>; the bare path goes to Discover.
export default function ScrollbookIndex() {
  redirect("/");
}
