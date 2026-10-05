import { auth, createUserWithEmailAndPassword, googleProvider, signInWithPopup, db, doc, getDoc, setDoc } from './firebase-init.js';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const error = document.getElementById('registerError');
  const btn = form.querySelector('button[type="submit"]');
  error.hidden = true; btn.disabled = true; btn.textContent = 'جاري الإنشاء...';
  
  const name = form.name.value;
  const stream = form.stream.value;
  const email = form.email.value;
  const password = form.password.value;
  
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      stream,
      email
    });
    location.href = 'index.html';
  } catch (err) {
    error.textContent = 'حدث خطأ أثناء الإنشاء: ' + err.message;
    error.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'إنشاء الحساب';
  }
});

document.getElementById('googleLogin').addEventListener('click', async (e) => {
  const error = document.getElementById('loginError') || document.getElementById('registerError');
  if(error) error.hidden = true;
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const userRef = doc(db, 'users', cred.user.uid);
    const snap = await getDoc(userRef);
    
    if (snap.exists() && snap.data().stream) {
      location.href = 'index.html';
    } else {
      try {
        await setDoc(userRef, {
          name: cred.user.displayName || cred.user.email.split('@')[0],
          stream: 'مشترك',
          email: cred.user.email,
          role: 'admin'
        }, { merge: true });
      } catch(e) {
        console.warn('Could not save profile, skipping...', e);
      }
      location.href = 'index.html';
    }  } catch (err) {
    if(error) {
      error.textContent = 'فشل الدخول بواسطة جوجل. قد يكون السبب عدم إضافة النطاق في إعدادات Firebase.';
      error.hidden = false;
    }
  }
});
