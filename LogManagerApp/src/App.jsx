import { useEffect, useState } from 'react';
import axios from 'axios';

const api_url = 'http://localhost:1984/v1/logs';

function App() {
  const [log_entry, setLogEntry] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', date: '', location: ''});
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async (pg = 1) => {
    const response = await axios.get(api_url + `?page=${pg}&limit=5`);
    setLogEntry(response.data.logs);
    setTotalPages(response.data.totalPages);
    setPage(response.data.page);
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (editId) {
      console.log('Updating entry with ID at URL:', editId, api_url);
      await axios.put(`${api_url}/${editId}`, form);
      setEditId(null);
    } else {
      console.log('Creating new entry at URL:', api_url);
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
    console.log('Deleting entry with ID at URL:', id, api_url);
    await axios.delete(`${api_url}/${id}`);
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
      <div>
        Page:
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => fetchLogs(i + 1)}
            style={{ margin: '0 5px', fontWeight: page === i + 1 ? 'bold' : 'normal' }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
  }

export default App;