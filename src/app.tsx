import { SceneLayout, SceneProvider } from "@/domains/scene";

export default function App() {
  return (
    <SceneProvider>
      <SceneLayout />
    </SceneProvider>
  );
}

App.displayName = "app";
