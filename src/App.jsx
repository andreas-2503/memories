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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memori, setMemori] = useState('');
  const [files, setFiles] = useState([]);
  const [daftarMemori, setDaftarMemori] = useState([]);
  const [fullScreenImages, setFullScreenImages] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleSimpan = async () => {
    if (!memori && files.length === 0) return;
    setIsLoading(true);
    setUploadProgress(0);

    // Menggunakan Promise.all agar upload berjalan secara paralel (bersamaan)
    const uploadPromises = files.map((file, index) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "memori_preset");

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.cloudinary.com/v1_1/px0xpddz/auto/upload");
        
        // Tracking progress untuk setiap file
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // Update progress kasar untuk memberi feedback ke user
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
            <button className="btn-delete" onClick={() => signOut(auth)}>Keluar</button>
          </div>

          <div className="koleksi-grid">
            {daftarMemori.map((m) => (
              <div key={m.id} className="memori-card">
                <p>{m.teks}</p>
                {m.mediaList && m.mediaList.length > 0 && (
                  <div onClick={() => setFullScreenImages(m.mediaList)}>
                    <Swiper navigation={true} modules={[Navigation]} className="swiper">
                      {m.mediaList.map((media, i) => (
                        <SwiperSlide key={i}>
                          {media.type === 'video' ? (
                            <video src={media.url} />
                          ) : (
                            <img src={media.url} alt="momen" />
                          )}
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
                {media.type === 'video' ? (
                  <video src={media.url} controls />
                ) : (
                  <img src={media.url} alt="full" />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}

export default App;