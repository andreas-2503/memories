import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState('');
  const [inputPin, setInputPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isPinSet, setIsPinSet] = useState(!!localStorage.getItem('userPin'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memori, setMemori] = useState('');
  const [files, setFiles] = useState([]);
  const [daftarMemori, setDaftarMemori] = useState([]);
  const [fullScreenImages, setFullScreenImages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Gagal download:", error);
      alert("Gagal mengunduh file.");
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(collection(db, "memori"), orderBy("tanggal", "desc"));
        onSnapshot(q, (snapshot) => {
          setDaftarMemori(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
      }
    });
  }, []);

  const handleSetPin = () => {
    localStorage.setItem('userPin', pin);
    setIsPinSet(true);
    setIsUnlocked(true);
  };

  const handleUnlock = () => {
    if (inputPin === localStorage.getItem('userPin')) {
      setIsUnlocked(true);
    } else {
      alert("PIN Salah!");
    }
  };

  const handleSimpan = async () => {
    if (!memori && files.length === 0) return;
    setIsLoading(true);
    setUploadProgress(0);

    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "memori_preset");

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.cloudinary.com/v1_1/px0xpddz/auto/upload");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => Math.min(prev + (progress / files.length), 99));
          }
        };
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send(formData);
      });
    });

    const results = await Promise.all(uploadPromises);
    const uploadedData = results.map(res => ({ url: res.secure_url, type: res.resource_type }));

    await addDoc(collection(db, "memori"), { teks: memori, mediaList: uploadedData, email: user.email, tanggal: new Date() });
    
    setIsLoading(false); 
    setMemori(''); 
    setFiles([]);
    setUploadProgress(0);
  };

  if (user && isPinSet && !isUnlocked) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Masukkan PIN Keamanan</h2>
        <input type="password" maxLength="6" onChange={(e) => setInputPin(e.target.value)} />
        <button className="btn-save" onClick={handleUnlock}>Buka Aplikasi</button>
      </div>
    );
  }

  if (user && !isPinSet) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Atur PIN Keamanan</h2>
        <input type="password" maxLength="6" onChange={(e) => setPin(e.target.value)} />
        <button className="btn-save" onClick={handleSetPin}>Simpan PIN</button>
      </div>
    );
  }

  return (
    <div className="container">
      <img src="/logo.png" alt="Logo" className="logo" />
      <h1>Memories</h1>

      {!user ? (
        <div className="input-section">
          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
          <button className="btn-save" onClick={() => signInWithEmailAndPassword(auth, email, password)}>Masuk</button>
        </div>
      ) : (
        <>
          <div className="input-section">
            <textarea value={memori} onChange={(e) => setMemori(e.target.value)} placeholder="Tulis kenangan..." />
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} />
            {isLoading && (
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                <p>{Math.round(uploadProgress)}%</p>
              </div>
            )}
            <button className="btn-save" onClick={handleSimpan} disabled={isLoading}>
              {isLoading ? "Mengunggah..." : "Simpan"}
            </button>
            <button className="btn-delete" onClick={() => { signOut(auth); setIsUnlocked(false); }}>Keluar</button>
          </div>

          <div className="koleksi-grid">
            {daftarMemori.map((m) => (
              <div key={m.id} className="memori-card">
                <p>{m.teks}</p>
                {m.mediaList && m.mediaList.length > 0 && (
                  <div>
                    <Swiper navigation={true} modules={[Navigation]} className="swiper">
                      {m.mediaList.map((media, i) => (
                        <SwiperSlide key={i}>
                          {media.type === 'video' ? <video src={media.url} /> : <img src={media.url} alt="momen" />}
                          <button className="btn-download" onClick={() => handleDownload(media.url, `memori-${m.id}-${i}.jpg`)}>
                            Download
                          </button>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                )}
                <button className="btn-delete" onClick={() => deleteDoc(doc(db, "memori", m.id))}>Hapus</button>
              </div>
            ))}
          </div>
        </>
      )}

      {fullScreenImages && (
        <div className="fullscreen-modal">
          <span className="close-btn" onClick={() => setFullScreenImages(null)}>&times;</span>
          <Swiper navigation={true} pagination={{ clickable: true }} keyboard={true} modules={[Navigation, Pagination, Keyboard]} className="swiper-full">
            {fullScreenImages.map((media, i) => (
              <SwiperSlide key={i} className="slide-full">
                {media.type === 'video' ? <video src={media.url} controls /> : <img src={media.url} alt="full" />}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}

export default App;