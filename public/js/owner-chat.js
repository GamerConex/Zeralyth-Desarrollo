const socket = io();
const form = document.getElementById('chatForm');
const input = document.getElementById('content');
const chatBox = document.getElementById('chatBox');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  socket.emit('owner-message', input.value);
  input.value = '';
});

socket.on('owner-message', (msg) => {
  const el = document.createElement('div');
  el.textContent = `[${new Date(msg.date).toLocaleTimeString()}] ${msg.user}: ${msg.content}`;
  chatBox.appendChild(el);
});
