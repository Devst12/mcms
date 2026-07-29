import { getFarmers } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function SlipLanding() {
  const farmers = await getFarmers();
  if (farmers.length > 0) {
    redirect(`/slip/${farmers[0]._id}`);
  }
  redirect("/farmers");
}
