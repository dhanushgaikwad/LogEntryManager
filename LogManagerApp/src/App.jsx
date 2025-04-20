import { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

const api_url = 'http://192.168.1.203:1984/';
const log_path = 'v1/logs';
const user_path = 'v1/users';

function App() {
  const [log_entry, setLogEntry] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', date: '', location: ''});
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nameOptions, setNameOptions] = useState([]);;

  const fetchLogs = async (pg = 1) => {
    const response = await axios.get(api_url + log_path + `?page=${pg}&limit=5`);
    setLogEntry(response.data.logs);
    setTotalPages(response.data.totalPages);
    setPage(response.data.page);
  };

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    if (editId) {
      console.log('Updating entry with ID at URL:', editId, api_url);
      await axios.put(`${api_url}${log_path}/${editId}`, form);
      setEditId(null);
    } else {
      console.log('Creating new entry at URL:', api_url);
      await axios.post(api_url+log_path, form);
    }
    setForm({ name: form.name, description: '', date: '', location: '' });
    fetchLogs();
    localStorage.setItem('lastUsedName', form.name);
    fetchNames();
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

  const fetchNames = async () => {
    const response = await axios.get(api_url + user_path);
    const options = response.data.map(user => ({label: user.username, value: user.username}));
    setNameOptions(options);
    console.log('Fetched names:', options);

    const lastUsedName = localStorage.getItem('lastUsedName');
    if (lastUsedName) {
      setForm(prev => ({ ...prev, name: lastUsedName }));
    }

  }

  useEffect(() => {
    fetchLogs();
    fetchNames();
  }, []);
  return (
    <div>
      <h1>Log Entry Manager</h1>
      <form onSubmit={handleCreateEntry}>
        <CreatableSelect
          isClearable
          onChange={(selected) =>
            setForm({ ...form, name: selected ? selected.value : '' })
          }
          onCreateOption={(inputValue) =>
            setForm({ ...form, name: inputValue })
          }
          value={form.name ? { value: form.name, label: form.name } : null}
          options={nameOptions}
        />
        <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <input type="text" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
        <button type="submit">{editId ? 'Update' : 'Create'}</button>
      </form>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
  <thead>
    <tr>
      <th>Name</th>
      <th>Description</th>
      <th>Date</th>
      <th>Location</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {log_entry.map((entry) => (
      <tr key={entry.id}>
        <td>{entry.name}</td>
        <td>{entry.description}</td>
        <td>{entry.date}</td>
        <td>{entry.location}</td>
        <td>
          <button onClick={() => handleEditEntry(entry)}>Edit</button>
          <button onClick={() => handleDeleteEntry(entry.id)} style={{ marginLeft: '5px' }}>Delete</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

<div style={{ marginTop: '10px' }}>
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