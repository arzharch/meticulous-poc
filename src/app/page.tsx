import { Suspense } from "react";
import { AssessmentApp } from "@/components/AssessmentApp";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <AssessmentApp />
    </Suspense>
  );
}
