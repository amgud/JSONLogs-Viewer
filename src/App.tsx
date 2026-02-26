import { LogViewer } from "@/components/LogViewer"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <TooltipProvider>
      <LogViewer />
    </TooltipProvider>
  )
}

export default App

