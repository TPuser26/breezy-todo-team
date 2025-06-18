
import { Header } from '@/components/dashboard/Header'
import { WelcomeSection } from '@/components/dashboard/WelcomeSection'
import { TaskList } from '@/components/tasks/TaskList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tasks">Gestion des tâches</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <WelcomeSection />
          </TabsContent>
          
          <TabsContent value="tasks" className="space-y-6">
            {/* Ne charger TaskList que quand l'onglet est actif */}
            {activeTab === 'tasks' && <TaskList />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
