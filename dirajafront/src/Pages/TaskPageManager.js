import React from 'react'
import AddTask from '../Components/TaskManager/AddTask'
import TasksList from '../Components/TaskManager/TaskList'

function TaskPageManager() {
  return (
    <div>
      <TasksList />
      <AddTask />
      
    </div>
  )
}

export default TaskPageManager
