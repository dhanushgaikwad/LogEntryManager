import { useEffect, useState } from 'react';
import axios from 'axios';

const api_url = 'http://localhost:1984/v1/logs';

function App() {
  const [log_entry, setLogEntry] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', date: '', location: ''});
  const [editId, setEditId] = useState(null);

  const fetchLogs = async () => {
    const response = await axios.get(api_url);
    setLogEntry(response.data);
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (editId) {
      await axios.put('${api_url}/${editId}', form);
      setEditId(null);
    } else {
      await axios.post(api_url, form);
    }
    setForm({ name: '', description: '', date: '', location: '' });
    fetchLogs();
  };

  const handleEditEntry = (entry) => {
    setForm({ name: entry.name, description: entry.description, date: entry.date, location: entry.location });
    setEditId(entry.id);
  };

  const handleDeleteEntry = async(id) => {
    await axios.delete('${api_url}/${id}');
    fetchLogs();
  };

  useEffect(() => {
    fetchLogs();
  }, []);
  return (
    <div>
      <h1>Log Entry Manager</h1>
      <form onSubmit={handleCreateEntry}>
        <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <button type="submit">{editId ? 'Update' : 'Create'}</button>
      </form>
      <ul>
        {log_entry.map((entry) => (
          <li key={entry.id}>
            {entry.name} - {entry.description} - {entry.date} - {entry.location}
            <button onClick={() => handleEditEntry(entry)}>Edit</button>
            <button onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
  }

export default App;