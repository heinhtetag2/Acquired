import { redirect } from "next/navigation";

// Scrollbook has no index page yet; open the Disney book (the page it was duplicated from).
export default function ScrollbookIndex() {
  redirect("/scrollbook/disney-the-renaissance-and-the-empire");
}
