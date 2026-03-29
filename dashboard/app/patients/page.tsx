import { redirect } from "next/navigation";

export default function PatientsLegacyRedirect() {
  redirect("/provider/patients");
}
