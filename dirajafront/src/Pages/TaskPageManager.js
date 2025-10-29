import React from 'react'
import AddTask from '../Components/TaskManager/AddTask'
import TasksList from '../Components/TaskManager/TaskList'
import UserPendingTasks from '../Components/TaskManager/UserPendingTasks'
import { Link } from 'react-router-dom';

function TaskPageManager() {
  return (
    <div>
      <div className='header-container'>
              <h1>Task Manager</h1>
             <div>
              <Link className='add-button' to="/create-task">Create Task ＋ </Link>
              </div>
              </div>
      <TasksList />
      
    </div>
  )
}

export default TaskPageManager
