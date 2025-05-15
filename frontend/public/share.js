document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('share-btn');
    
    shareBtn.addEventListener('click', async () => {
      const taskId = document.getElementById('task-select').value;
      const email = document.getElementById('share-email').value;
  
      try {
        const response = await fetch('/api/share/${taskId}/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ email })
        });
  
        if (response.ok) {
          alert('Task shared successfully!');
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } catch (err) {
        alert('Failed to share task');
      }
    });
  
    // Load shared tasks
    async function loadSharedTasks() {
      const res = await fetch('/api/shared-tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const tasks = await res.json();
      const container = document.getElementById('shared-tasks');
      
      tasks.forEach(task => {
        container.innerHTML += `
          <div class="task">
            <h3>${task.title}</h3>
            <p>Shared by: ${task.user.name}</p>
          </div>
        `;
      });
    }
  
    loadSharedTasks();
  });