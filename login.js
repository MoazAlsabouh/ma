import { auth, signInWithEmailAndPassword, googleProvider, signInWithPopup, db, doc, getDoc, setDoc } from './firebase-init.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const error = document.getElementById('loginError');
  const btn = form.querySelector('button[type="submit"]');
  error.hidden = true; btn.disabled = true; btn.textContent = 'جاري التحقق...';
  
  const email = form.email.value;
  const password = form.password.value;
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = 'index.html';
  } catch (err) {
    error.textContent = 'خطأ في البريد الإلكتروني أو كلمة المرور.';
    error.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'تسجيل الدخول';
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
