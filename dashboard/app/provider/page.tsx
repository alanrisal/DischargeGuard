import { redirect } from "next/navigation";

export default function ProviderIndexPage() {
  redirect("/provider/patients");
}
