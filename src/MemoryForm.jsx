import { useState } from 'react';

function MemoryForm({ onAddMemory }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !content) return;
    
    const newMemory = {
      id: Date.now(),
      title,
      content,
      date: new Date().toLocaleDateString()
    };
    
    onAddMemory(newMemory);
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <h3>Tambah Kenangan Baru</h3>
      <input 
        type="text" 
        placeholder="Judul Kenangan" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
      />
      <textarea 
        placeholder="Apa yang terjadi?" 
        value={content} 
        onChange={(e) => setContent(e.target.value)} 
      />
      <button type="submit">Simpan Kenangan</button>
    </form>
  );
}

export default MemoryForm;