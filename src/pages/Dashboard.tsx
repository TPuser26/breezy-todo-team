
import { Header } from '@/components/dashboard/Header'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { TaskList } from '@/components/tasks/TaskList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tasks">Gestion des tâches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <WelcomeSection />
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-6">
            <TaskList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
